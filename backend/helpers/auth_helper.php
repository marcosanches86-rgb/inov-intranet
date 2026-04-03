<?php
declare(strict_types=1);

// ================================================================
//  Auth Helper — Convenience wrappers for Auth class
// ================================================================

/** Returns the ID of the currently authenticated user */
function currentUserId(): ?int
{
    return Auth::id();
}

/** Returns the role of the current user */
function currentUserRole(): ?string
{
    return Auth::role();
}

/** Returns true if current user is at least 'admin' */
function isAdmin(): bool
{
    return Auth::hasRole('admin');
}

/** Returns true if current user is 'super_admin' */
function isSuperAdmin(): bool
{
    return Auth::hasRole('super_admin');
}

/** Returns true if current user is at least 'editor' */
function isEditor(): bool
{
    return Auth::hasRole('editor');
}

/**
 * Gate check: aborts with 403 if user doesn't have the required role.
 * Call inside controllers for fine-grained checks.
 */
function gate(string $minRole): void
{
    if (!Auth::hasRole($minRole)) {
        Response::forbidden("Permissão insuficiente. Role necessário: {$minRole}");
    }
}

/**
 * Ensures the authenticated user can only access their own resource
 * OR is at least admin.
 */
function ownOrAdmin(int $resourceOwnerId): void
{
    if (currentUserId() !== $resourceOwnerId && !isAdmin()) {
        Response::forbidden('Só pode aceder aos seus próprios recursos.');
    }
}
