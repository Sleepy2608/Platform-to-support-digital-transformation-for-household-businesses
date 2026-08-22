package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductImage;
import com.hbdt.product.dto.ProductImageResponse;
import com.hbdt.repository.ProductImageRepository;
import com.hbdt.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProductImageService {

    private static final Logger logger = LoggerFactory.getLogger(ProductImageService.class);

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB
    private static final int MAX_IMAGES_PER_PRODUCT = 10;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ImageStorageService imageStorageService;
    private final BusinessContextService businessContextService;

    public ProductImageService(ProductRepository productRepository,
                               ProductImageRepository productImageRepository,
                               ImageStorageService imageStorageService,
                               BusinessContextService businessContextService) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.imageStorageService = imageStorageService;
        this.businessContextService = businessContextService;
    }

    // =========================================================
    // Upload images
    // =========================================================

    @Transactional
    public List<ProductImageResponse> uploadImages(String username, Long productId, MultipartFile[] files)
            throws IOException {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = findOwnedProduct(productId, businessId);

        if (files == null || files.length == 0) {
            throw new BadRequestException("Vui lòng chọn ít nhất 1 file ảnh");
        }

        long existingCount = productImageRepository.countByProductId(productId);
        if (existingCount + files.length > MAX_IMAGES_PER_PRODUCT) {
            throw new BadRequestException(
                    String.format("Mỗi sản phẩm tối đa %d ảnh. Hiện có %d, không thể thêm %d ảnh.",
                            MAX_IMAGES_PER_PRODUCT, existingCount, files.length));
        }

        boolean hasExistingImages = existingCount > 0;
        List<ProductImageResponse> results = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            validateFile(file);

            ImageStorageService.StoredImage stored = imageStorageService.store(
                    file, "products/" + productId, MAX_FILE_SIZE, ALLOWED_CONTENT_TYPES);

            // First image of the product becomes primary automatically
            boolean makePrimary = !hasExistingImages && i == 0;

            ProductImage image = productImageRepository.save(ProductImage.builder()
                    .productId(productId)
                    .imageUrl(stored.objectKey())
                    .isPrimary(makePrimary)
                    .build());

            if (makePrimary) {
                syncPrimaryToProduct(product, stored.objectKey());
            }

            results.add(toResponse(image));
            logger.info("Product image uploaded: productId={}, imageId={}, objectKey={}",
                    productId, image.getId(), stored.objectKey());
        }

        return results;
    }

    // =========================================================
    // Get images
    // =========================================================

    public List<ProductImageResponse> getImages(String username, Long productId) {
        Long businessId = businessContextService.requireBusinessId(username);
        findOwnedProduct(productId, businessId);
        return productImageRepository.findByProductIdOrderByCreatedAtAsc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Internal method to get images for a product (no auth check).
     * Used by ProductService.toResponse() to include images in product detail.
     */
    public List<ProductImageResponse> getImagesByProductId(Long productId) {
        return productImageRepository.findByProductIdOrderByCreatedAtAsc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // Delete image
    // =========================================================

    @Transactional
    public void deleteImage(String username, Long imageId) {
        Long businessId = businessContextService.requireBusinessId(username);
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh với ID: " + imageId));

        Product product = findOwnedProduct(image.getProductId(), businessId);

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        productImageRepository.delete(image);

        if (wasPrimary) {
            // Reset product.image_url — pick next available image or set null
            List<ProductImage> remaining = productImageRepository
                    .findByProductIdOrderByCreatedAtAsc(product.getId());
            if (!remaining.isEmpty()) {
                ProductImage newPrimary = remaining.get(0);
                newPrimary.setIsPrimary(true);
                productImageRepository.save(newPrimary);
                syncPrimaryToProduct(product, newPrimary.getImageUrl());
            } else {
                product.setImageUrl(null);
                productRepository.save(product);
            }
        }

        logger.info("Product image deleted: imageId={}, productId={}", imageId, image.getProductId());
    }

    // =========================================================
    // Set primary
    // =========================================================

    @Transactional
    public ProductImageResponse setPrimary(String username, Long productId, Long imageId) {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = findOwnedProduct(productId, businessId);

        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh với ID: " + imageId));

        if (!image.getProductId().equals(productId)) {
            throw new BadRequestException("Ảnh không thuộc sản phẩm này");
        }

        // Clear old primary and set new one
        productImageRepository.clearPrimaryByProductId(productId);
        image.setIsPrimary(true);
        productImageRepository.save(image);

        // Sync to products.image_url
        syncPrimaryToProduct(product, image.getImageUrl());

        logger.info("Primary image set: productId={}, imageId={}", productId, imageId);
        return toResponse(image);
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private Product findOwnedProduct(Long productId, Long businessId) {
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));
    }

    private void syncPrimaryToProduct(Product product, String objectKey) {
        product.setImageUrl(objectKey);
        productRepository.save(product);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Kích thước file vượt quá 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Chỉ chấp nhận ảnh PNG, JPG, JPEG, WEBP");
        }
    }

    private ProductImageResponse toResponse(ProductImage image) {
        return new ProductImageResponse(
                image.getId(),
                image.getProductId(),
                imageStorageService.toPublicUrl(image.getImageUrl()),
                Boolean.TRUE.equals(image.getIsPrimary()),
                image.getCreatedAt()
        );
    }
}
