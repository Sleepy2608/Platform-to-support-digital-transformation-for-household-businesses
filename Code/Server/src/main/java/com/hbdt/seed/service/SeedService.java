package com.hbdt.seed.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.seed.entity.SeedConfig;
import com.hbdt.seed.repository.SeedConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SeedService {

    private static final Logger logger = LoggerFactory.getLogger(SeedService.class);

    private static final Set<String> PROTECTED_TABLES = Set.of();

    private final SeedConfigRepository configRepository;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper;
    private final SeedCrypto seedCrypto;
    private final Path seedDir;

    public SeedService(SeedConfigRepository configRepository,
                       JdbcTemplate jdbcTemplate,
                       DataSource dataSource,
                       ObjectMapper objectMapper,
                       SeedCrypto seedCrypto,
                       @Value("${app.seed.dir:./seed}") String seedDirPath) {
        this.configRepository = configRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.objectMapper = objectMapper;
        this.seedCrypto = seedCrypto;
        this.seedDir = Path.of(seedDirPath);
    }

    public List<String> listTables() {
        List<String> tables = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet rs = meta.getTables(conn.getCatalog(), null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String name = rs.getString("TABLE_NAME");
                    if (!PROTECTED_TABLES.contains(name.toLowerCase())) {
                        tables.add(name);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("listTables loi: {}", e.getMessage(), e);
        }
        return tables;
    }

    public List<SeedConfig> listConfigs() {
        return configRepository.findAll();
    }

    @Transactional
    public SeedConfig snapshot(String tableName) {
        validateTable(tableName);

        List<Map<String, Object>> current = jdbcTemplate.queryForList("SELECT * FROM " + quote(tableName));
        List<Map<String, Object>> rows = mergeWithExisting(tableName, current);

        // Version moi = version cao nhat hien co (trong DB hoac file) + 1
        long newVersion = Math.max(existingVersionInDb(tableName), versionInFile(tableName)) + 1;

        String filePath = "seed/" + tableName + ".json";
        String json = writeJson(tableName, rows, newVersion);
        writeFile(tableName, json);
        String checksum = sha256(json);

        SeedConfig config = configRepository.findByTableName(tableName)
                .orElseGet(() -> SeedConfig.builder()
                        .tableName(tableName)
                        .seedOrder(nextOrder())
                        .enabled(true)
                        .build());

        config.setFilePath(filePath);
        config.setRowCount(rows.size());
        config.setChecksum(checksum);
        config.setVersion(newVersion);
        if (config.getEnabled() == null) {
            config.setEnabled(true);
        }

        SeedConfig saved = configRepository.save(config);
        logger.info("Snapshot bang [{}]: {} dong -> {}", tableName, rows.size(), filePath);
        return saved;
    }

    @Transactional
    public List<SeedConfig> snapshotAll() {
        List<SeedConfig> result = new ArrayList<>();
        for (String table : listTables()) {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + quote(table), Integer.class);
            if (count != null && count > 0) {
                result.add(snapshot(table));
            }
        }
        return result;
    }

    @Transactional
    public int restoreAll() {
        syncConfigsFromFiles();
        List<SeedConfig> configs = configRepository.findAllByEnabledTrueOrderBySeedOrderAsc();
        int restored = 0;

        for (SeedConfig config : configs) {
            try {
                if (!isValidTable(config.getTableName())) {
                    logger.warn("Bo qua [{}]: ten bang khong hop le hoac bi chan.", config.getTableName());
                    continue;
                }

                Path file = seedDir.resolve(config.getTableName() + ".json");
                if (!Files.exists(file)) {
                    logger.warn("Bo qua [{}]: khong tim thay file {}", config.getTableName(), file);
                    continue;
                }

                String json = readSeedFile(file);
                long fileVersion = readVersion(json);
                long seededVersion = config.getLastSeededVersion() == null ? 0 : config.getLastSeededVersion();

                // Chi bo qua khi da nap dung version nay VA bang van con du lieu.
                if (fileVersion <= seededVersion && rowCount(config.getTableName()) > 0) {
                    logger.info("Bo qua [{}]: da la version moi nhat (v{}).", config.getTableName(), fileVersion);
                    continue;
                }

                List<Map<String, Object>> rows = readJson(json);
                int n = upsertRows(config.getTableName(), rows);

                config.setLastSeededChecksum(sha256(json));
                config.setLastSeededVersion(fileVersion);
                if (config.getVersion() == null || fileVersion > config.getVersion()) {
                    config.setVersion(fileVersion);
                }
                configRepository.save(config);
                restored++;
                logger.info("Seek [{}]: da nap/cap nhat {} dong (version {}).", config.getTableName(), n, fileVersion);
            } catch (Exception e) {
                logger.error("Seek [{}] loi, bo qua: {}", config.getTableName(), e.getMessage(), e);
            }
        }
        return restored;
    }

    private void syncConfigsFromFiles() {
        if (!Files.isDirectory(seedDir)) {
            return;
        }
        try (var stream = Files.list(seedDir)) {
            stream.filter(p -> p.getFileName().toString().endsWith(".json"))
                    .forEach(p -> {
                        String table = p.getFileName().toString().replaceFirst("\\.json$", "");
                        if (!isValidTable(table)) {
                            logger.warn("Bo qua file {}: ten bang khong hop le hoac bi chan.", p.getFileName());
                            return;
                        }
                        if (configRepository.findByTableName(table).isPresent()) {
                            return;
                        }
                        try {
                            String json = readSeedFile(p);
                            int rowCount = readJson(json).size();
                            SeedConfig config = SeedConfig.builder()
                                    .tableName(table)
                                    .filePath("seed/" + table + ".json")
                                    .rowCount(rowCount)
                                    .enabled(true)
                                    .seedOrder(nextOrder())
                                    .checksum(sha256(json))
                                    .version(readVersion(json))
                                    .build();
                            configRepository.save(config);
                            logger.info("Tu dang ky seek [{}] tu file ({} dong).", table, rowCount);
                        } catch (Exception e) {
                            logger.error("Khong dang ky duoc file {}: {}", p, e.getMessage());
                        }
                    });
        } catch (Exception e) {
            logger.error("Loi quet thu muc seed: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void delete(Long id) {
        configRepository.deleteById(id);
    }

    @Transactional
    public SeedConfig setEnabled(Long id, boolean enabled) {
        SeedConfig config = configRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay cau hinh id=" + id));
        config.setEnabled(enabled);
        return configRepository.save(config);
    }

    private int upsertRows(String tableName, List<Map<String, Object>> rows) {
        if (rows.isEmpty()) {
            return 0;
        }

        Set<String> realColumns = actualColumns(tableName);
        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        for (String c : columns) {
            if (!realColumns.contains(c.toLowerCase())) {
                throw new IllegalArgumentException("Cot khong hop le trong file seek: " + c);
            }
        }

        String cols = String.join(", ", columns.stream().map(this::quote).toList());
        String placeholders = String.join(", ", columns.stream().map(c -> "?").toList());
        String updates = String.join(", ",
                columns.stream().map(c -> quote(c) + " = VALUES(" + quote(c) + ")").toList());

        String sql = "INSERT INTO " + quote(tableName) + " (" + cols + ") VALUES (" + placeholders + ") "
                + "ON DUPLICATE KEY UPDATE " + updates;

        int count = 0;
        for (Map<String, Object> row : rows) {
            Object[] values = columns.stream().map(row::get).toArray();
            count += jdbcTemplate.update(sql, values);
        }
        return count;
    }

    private int rowCount(String tableName) {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + quote(tableName), Integer.class);
            return count == null ? 0 : count;
        } catch (Exception e) {
            return 0;
        }
    }

    private Set<String> actualColumns(String tableName) {
        Set<String> cols = new java.util.HashSet<>();
        try (Connection conn = dataSource.getConnection();
             ResultSet rs = conn.getMetaData().getColumns(conn.getCatalog(), null, tableName, "%")) {
            while (rs.next()) {
                cols.add(rs.getString("COLUMN_NAME").toLowerCase());
            }
        } catch (Exception e) {
            throw new RuntimeException("Khong doc duoc cot cua bang " + tableName, e);
        }
        return cols;
    }

    private List<Map<String, Object>> mergeWithExisting(String tableName, List<Map<String, Object>> current) {
        Path file = seedDir.resolve(tableName + ".json");
        if (!Files.exists(file)) {
            return current;
        }

        List<Map<String, Object>> existing;
        try {
            existing = readJson(readSeedFile(file));
        } catch (Exception e) {
            logger.warn("Khong doc duoc file cu {}, dung du lieu hien tai: {}", file, e.getMessage());
            return current;
        }

        String keyColumn = current.isEmpty()
                ? (existing.isEmpty() ? null : pickKey(existing.get(0)))
                : pickKey(current.get(0));

        if (keyColumn == null) {
            return current.isEmpty() ? existing : current;
        }

        Map<String, Map<String, Object>> merged = new LinkedHashMap<>();
        for (Map<String, Object> row : existing) {
            merged.put(keyOf(row, keyColumn), row);
        }
        for (Map<String, Object> row : current) {
            merged.put(keyOf(row, keyColumn), row);
        }
        return new ArrayList<>(merged.values());
    }

    private String pickKey(Map<String, Object> row) {
        if (row.containsKey("id")) {
            return "id";
        }
        return row.keySet().stream().findFirst().orElse(null);
    }

    private String keyOf(Map<String, Object> row, String keyColumn) {
        Object v = row.get(keyColumn);
        return v == null ? "" : String.valueOf(v);
    }

    private void validateTable(String tableName) {
        if (tableName == null || !tableName.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Ten bang khong hop le: " + tableName);
        }
        if (PROTECTED_TABLES.contains(tableName.toLowerCase())) {
            throw new IllegalArgumentException("Bang [" + tableName + "] khong duoc phep snapshot (bao mat).");
        }
        if (!listTables().contains(tableName)) {
            throw new IllegalArgumentException("Bang [" + tableName + "] khong ton tai.");
        }
    }

    private boolean isValidTable(String tableName) {
        return tableName != null
                && tableName.matches("[A-Za-z0-9_]+")
                && !PROTECTED_TABLES.contains(tableName.toLowerCase())
                && listTables().contains(tableName);
    }

    private String writeJson(String tableName, List<Map<String, Object>> rows, long version) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("table", tableName);
        payload.put("version", version);
        payload.put("rows", rows);
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
        } catch (IOException e) {
            throw new RuntimeException("Loi ghi JSON cho bang " + tableName, e);
        }
    }

    private long readVersion(String json) {
        try {
            Map<?, ?> payload = objectMapper.readValue(json, Map.class);
            Object v = payload.get("version");
            return v instanceof Number ? ((Number) v).longValue() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private long existingVersionInDb(String tableName) {
        return configRepository.findByTableName(tableName)
                .map(c -> c.getVersion() == null ? 0L : c.getVersion())
                .orElse(0L);
    }

    private long versionInFile(String tableName) {
        Path file = seedDir.resolve(tableName + ".json");
        if (!Files.exists(file)) {
            return 0;
        }
        try {
            return readVersion(readSeedFile(file));
        } catch (Exception e) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readJson(String json) {
        try {
            Map<String, Object> payload = objectMapper.readValue(json, Map.class);
            Object rows = payload.get("rows");
            if (rows instanceof List<?> list) {
                return (List<Map<String, Object>>) list;
            }
            return List.of();
        } catch (IOException e) {
            throw new RuntimeException("Loi doc JSON seek", e);
        }
    }

    private void writeFile(String tableName, String json) {
        try {
            Files.createDirectories(seedDir);
            String content = seedCrypto.encrypt(json);
            Files.writeString(seedDir.resolve(tableName + ".json"), content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Loi ghi file seek cho bang " + tableName, e);
        }
    }

    private String readSeedFile(Path file) throws IOException {
        String content = Files.readString(file, StandardCharsets.UTF_8);
        return seedCrypto.decrypt(content);
    }

    private int nextOrder() {
        return configRepository.findAll().stream()
                .mapToInt(c -> c.getSeedOrder() == null ? 0 : c.getSeedOrder())
                .max().orElse(0) + 10;
    }

    private String quote(String identifier) {
        return "`" + identifier.replace("`", "") + "`";
    }

    private String sha256(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
