package com.hbdt.ai.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Starts the local Python AI service together with Spring Boot during development. */
@Component
@Profile("dev")
public class AiServiceProcessManager implements ApplicationRunner, DisposableBean {
    private static final Logger log = LoggerFactory.getLogger(AiServiceProcessManager.class);
    private static final Duration HEALTH_TIMEOUT = Duration.ofSeconds(1);
    private static final Duration STARTUP_TIMEOUT = Duration.ofSeconds(8);

    private final boolean autoStart;
    private final String serviceUrl;
    private final String configuredWorkDirectory;
    private final String apiSecret;
    private final HttpClient healthClient;

    private volatile Process managedProcess;

    public AiServiceProcessManager(
            @Value("${ai.service.auto-start:true}") boolean autoStart,
            @Value("${ai.service.url:http://127.0.0.1:8000}") String serviceUrl,
            @Value("${ai.service.work-dir:../AI}") String configuredWorkDirectory,
            @Value("${ai.service.api-secret:}") String apiSecret) {
        this.autoStart = autoStart;
        this.serviceUrl = serviceUrl.replaceAll("/+$", "");
        this.configuredWorkDirectory = configuredWorkDirectory;
        this.apiSecret = apiSecret;
        this.healthClient = HttpClient.newBuilder().connectTimeout(HEALTH_TIMEOUT).build();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!autoStart) {
            log.info("AI service auto-start is disabled.");
            return;
        }

        URI serviceUri;
        try {
            serviceUri = URI.create(serviceUrl);
        } catch (IllegalArgumentException error) {
            log.warn("Cannot auto-start AI service because ai.service.url is invalid: {}", serviceUrl);
            return;
        }

        if (!isLocalAddress(serviceUri.getHost())) {
            log.info("AI service uses a remote/container URL; local auto-start was skipped: {}", serviceUrl);
            return;
        }
        if (isHealthy()) {
            if (isReady()) {
                log.info("AI service is already running and configured at {}.", serviceUrl);
            } else {
                log.warn("AI service is running at {} but is not configured. Check BAI_API_KEY, "
                        + "BAI_MODEL and AI_SERVICE_API_SECRET, then restart it.", serviceUrl);
            }
            return;
        }

        Path aiDirectory = findAiDirectory();
        if (aiDirectory == null) {
            log.warn("Cannot find the AI directory. Set AI_SERVICE_WORK_DIR or run from Code/Server.");
            return;
        }
        Path pythonExecutable = findPythonExecutable(aiDirectory);
        if (pythonExecutable == null) {
            log.warn("Cannot auto-start AI service because {} has no .venv. Create it once with Python 3.12.",
                    aiDirectory);
            return;
        }

        String host = "localhost".equalsIgnoreCase(serviceUri.getHost())
                ? "127.0.0.1" : serviceUri.getHost();
        int port = serviceUri.getPort() > 0 ? serviceUri.getPort() : 8000;
        ProcessBuilder builder = new ProcessBuilder(
                pythonExecutable.toString(), "-m", "uvicorn", "main:app",
                "--host", host, "--port", Integer.toString(port));
        builder.directory(aiDirectory.toFile());
        builder.redirectErrorStream(true);
        if (!apiSecret.isBlank()) {
            // Spring may read the secret from Code/Server/.env without exporting it to child processes.
            builder.environment().put("AI_SERVICE_API_SECRET", apiSecret);
        }

        try {
            managedProcess = builder.start();
            streamOutput(managedProcess);
            if (waitUntilHealthy()) {
                if (isReady()) {
                    log.info("AI service started automatically and is configured at {}.", serviceUrl);
                } else {
                    log.warn("AI service started at {} but is not configured. Fill BAI_API_KEY and "
                            + "BAI_MODEL in Code/AI/.env, then restart the backend.", serviceUrl);
                }
            } else if (!managedProcess.isAlive()) {
                log.warn("AI service exited during startup with code {}.", managedProcess.exitValue());
                managedProcess = null;
            } else {
                log.warn("AI service process started but health check is not ready at {}.", serviceUrl);
            }
        } catch (IOException error) {
            log.warn("Cannot start AI service automatically: {}", error.getMessage());
            managedProcess = null;
        }
    }

    private Path findAiDirectory() {
        Path currentDirectory = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path configured = Path.of(configuredWorkDirectory);
        if (!configured.isAbsolute()) configured = currentDirectory.resolve(configured);
        List<Path> candidates = List.of(
                configured.normalize(),
                currentDirectory.resolve("../AI").normalize(),
                currentDirectory.resolve("Code/AI").normalize());
        return candidates.stream()
                .filter(path -> Files.isRegularFile(path.resolve("main.py")))
                .findFirst()
                .orElse(null);
    }

    private Path findPythonExecutable(Path aiDirectory) {
        List<Path> candidates = List.of(
                aiDirectory.resolve(".venv/Scripts/python.exe"),
                aiDirectory.resolve(".venv/bin/python"));
        return candidates.stream().filter(Files::isRegularFile).findFirst().orElse(null);
    }

    private boolean waitUntilHealthy() {
        long deadline = System.nanoTime() + STARTUP_TIMEOUT.toNanos();
        while (System.nanoTime() < deadline) {
            if (isHealthy()) return true;
            if (managedProcess == null || !managedProcess.isAlive()) return false;
            try {
                Thread.sleep(200);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    private boolean isHealthy() {
        return requestStatus(serviceUrl + "/health", false) == 200;
    }

    private boolean isReady() {
        return !apiSecret.isBlank() && requestStatus(serviceUrl + "/api/v1/ai/ready", true) == 200;
    }

    private int requestStatus(String url, boolean authenticated) {
        try {
            HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(HEALTH_TIMEOUT).GET();
            if (authenticated) request.header("X-API-Secret", apiSecret);
            return healthClient.send(request.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
        } catch (IOException | InterruptedException | IllegalArgumentException error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            return -1;
        }
    }

    private void streamOutput(Process process) {
        Thread outputThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                    process.getInputStream(), StandardCharsets.UTF_8))) {
                reader.lines().forEach(line -> log.info("[AI] {}", line));
            } catch (IOException error) {
                if (process.isAlive()) log.debug("Stopped reading AI service output.", error);
            }
        }, "ai-service-output");
        outputThread.setDaemon(true);
        outputThread.start();
    }

    private boolean isLocalAddress(String host) {
        return host != null && (host.equalsIgnoreCase("localhost")
                || host.equals("127.0.0.1") || host.equals("::1"));
    }

    @Override
    public void destroy() {
        Process process = managedProcess;
        if (process == null || !process.isAlive()) return;
        process.destroy();
        try {
            if (!process.waitFor(3, TimeUnit.SECONDS)) process.destroyForcibly();
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
        }
        log.info("AI service process stopped with the backend.");
    }
}
