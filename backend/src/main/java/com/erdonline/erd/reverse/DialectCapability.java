package com.erdonline.erd.reverse;

/**
 * 方言能力矩阵，供前端显隐控件与降级提示。
 *
 * @author erdonline
 */
public final class DialectCapability {

    private final boolean supportsSchema;
    private final boolean supportsIndex;
    private final boolean supportsForeignKey;
    private final boolean supportsAutoIncrement;
    private final boolean supportsComment;
    private final boolean supportsTrigger;

    private DialectCapability(Builder builder) {
        this.supportsSchema = builder.supportsSchema;
        this.supportsIndex = builder.supportsIndex;
        this.supportsForeignKey = builder.supportsForeignKey;
        this.supportsAutoIncrement = builder.supportsAutoIncrement;
        this.supportsComment = builder.supportsComment;
        this.supportsTrigger = builder.supportsTrigger;
    }

    public boolean isSupportsSchema() {
        return supportsSchema;
    }

    public boolean isSupportsIndex() {
        return supportsIndex;
    }

    public boolean isSupportsForeignKey() {
        return supportsForeignKey;
    }

    public boolean isSupportsAutoIncrement() {
        return supportsAutoIncrement;
    }

    public boolean isSupportsComment() {
        return supportsComment;
    }

    public boolean isSupportsTrigger() {
        return supportsTrigger;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private boolean supportsSchema;
        private boolean supportsIndex;
        private boolean supportsForeignKey;
        private boolean supportsAutoIncrement;
        private boolean supportsComment;
        private boolean supportsTrigger;

        public Builder supportsSchema(boolean supportsSchema) {
            this.supportsSchema = supportsSchema;
            return this;
        }

        public Builder supportsIndex(boolean supportsIndex) {
            this.supportsIndex = supportsIndex;
            return this;
        }

        public Builder supportsForeignKey(boolean supportsForeignKey) {
            this.supportsForeignKey = supportsForeignKey;
            return this;
        }

        public Builder supportsAutoIncrement(boolean supportsAutoIncrement) {
            this.supportsAutoIncrement = supportsAutoIncrement;
            return this;
        }

        public Builder supportsComment(boolean supportsComment) {
            this.supportsComment = supportsComment;
            return this;
        }

        public Builder supportsTrigger(boolean supportsTrigger) {
            this.supportsTrigger = supportsTrigger;
            return this;
        }

        public DialectCapability build() {
            return new DialectCapability(this);
        }
    }
}
