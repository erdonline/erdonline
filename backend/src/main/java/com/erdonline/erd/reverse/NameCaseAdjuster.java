package com.erdonline.erd.reverse;

import com.erdonline.erd.model.UpOrLow;
import com.erdonline.erd.util.StringKit;

/**
 * 逻辑名大小写转换（DEFAULT / LOWCASE / UPPERCASE）。
 *
 * @author erdonline
 */
public final class NameCaseAdjuster {

    private NameCaseAdjuster() {
    }

    public static String adjust(String name, String flag) {
        if (name == null) {
            return null;
        }
        String normalizedFlag = StringKit.nvl(flag, "");
        if (UpOrLow.DEFAULT.toString().equals(normalizedFlag)) {
            return name;
        }
        if (UpOrLow.LOWCASE.toString().equals(normalizedFlag)) {
            return name.toLowerCase();
        }
        return name.toUpperCase();
    }
}
