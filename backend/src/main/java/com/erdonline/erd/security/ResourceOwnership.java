package com.erdonline.erd.security;

/**
 * Identity match for resources whose creator column may hold username or userId (legacy).
 */
public final class ResourceOwnership {

    private ResourceOwnership() {
    }

    public static boolean matchesCreator(String creator, String userId, String username) {
        if (creator == null || creator.isBlank()) {
            return false;
        }
        return creator.equals(userId) || creator.equals(username);
    }
}
