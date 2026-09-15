package com.hbdt.admin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job that activates scheduled template versions when their
 * effective date arrives (effectiveFrom <= today).
 *
 * <p>Runs daily at midnight (00:00). When a new version is activated,
 * existing active versions transition to SUPERSEDED, older superseded
 * versions transition to ARCHIVED, and the template's currentVersionId
 * is updated.</p>
 */
@Component
public class TemplateVersionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TemplateVersionScheduler.class);

    private final FinancialTemplateService templateService;

    public TemplateVersionScheduler(FinancialTemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * Executes daily at midnight (00:00) to activate scheduled template versions.
     */
    @Scheduled(cron = "${app.template.version-activation-cron:0 0 0 * * *}")
    public void activateScheduledVersions() {
        logger.info("Starting scheduled template version activation check...");
        try {
            int activated = templateService.activateScheduledVersions();
            if (activated > 0) {
                logger.info("Scheduled template version activation completed: {} version(s) activated.", activated);
            } else {
                logger.debug("No scheduled template versions due for activation today.");
            }
        } catch (Exception e) {
            logger.error("Error occurred during scheduled template version activation", e);
        }
    }
}
