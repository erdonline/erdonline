package com.erdonline.erd.schema;

import com.erdonline.erd.model.ParseDataModel;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

/**
 * Classifies live vs model schema fingerprints.
 */
public final class SchemaProbeService {

    private SchemaProbeService() {
    }

    public static SchemaProbeResult probe(ParseDataModel liveModel, Map<String, Object> projectJson) {
        String checkedAt = Instant.now().toString();
        if (liveModel == null || liveModel.getModule() == null) {
            return SchemaProbeResult.builder()
                    .status(SchemaProbeStatus.UNKNOWN)
                    .checkedAt(checkedAt)
                    .reason(SchemaProbeReason.PROBE_REVERSE_EMPTY)
                    .message("逆向解析未返回表结构")
                    .build();
        }

        SchemaFingerprint liveFp = SchemaFingerprintBuilder.fromParseDataModel(liveModel);
        String liveHash = SchemaFingerprintHasher.hash(liveFp);
        int tableCount = liveFp.getTables().size();

        if (projectJson == null || projectJson.isEmpty()) {
            return SchemaProbeResult.builder()
                    .status(SchemaProbeStatus.UNKNOWN)
                    .fingerprint(liveHash)
                    .checkedAt(checkedAt)
                    .tableCount(tableCount)
                    .reason(SchemaProbeReason.PROBE_NO_MODEL)
                    .message("未提供 projectJSON，仅返回实库指纹")
                    .build();
        }

        SchemaFingerprint modelFp = SchemaFingerprintBuilder.fromProjectJson(projectJson);
        String modelHash = SchemaFingerprintHasher.hash(modelFp);

        SchemaProbeStatus status = SchemaFingerprintDiff.classify(liveFp, modelFp);
        SchemaProbeReason reason = status == SchemaProbeStatus.SYNCED ? null : SchemaProbeReason.FINGERPRINT_MISMATCH;

        return SchemaProbeResult.builder()
                .status(status)
                .fingerprint(liveHash)
                .modelFingerprint(modelHash)
                .checkedAt(checkedAt)
                .tableCount(tableCount)
                .reason(reason)
                .build();
    }

    public static SchemaProbeResult connectionFailed(String message) {
        SchemaProbeReason reason = isPermissionError(message)
                ? SchemaProbeReason.PROBE_NO_PERMISSION
                : SchemaProbeReason.PROBE_CONNECTION_FAILED;
        return SchemaProbeResult.builder()
                .status(SchemaProbeStatus.UNKNOWN)
                .checkedAt(Instant.now().toString())
                .reason(reason)
                .message(message)
                .build();
    }

    static boolean isPermissionError(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains("access denied")
                || lower.contains("permission denied")
                || lower.contains("not authorized")
                || lower.contains("authorization failed")
                || lower.contains("insufficient privileges")
                || lower.contains("拒绝访问")
                || lower.contains("权限");
    }
}
