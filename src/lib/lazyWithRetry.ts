import { lazy, ComponentType } from "react"

/**
 * A wrapper around React.lazy that handles "Failed to fetch dynamic module" errors.
 * This happens when a user stays on an old version of the app and tries to 
 * navigate to a page whose JS chunk has been replaced on the server.
 */
export const lazyWithRetry = (
    componentImport: () => Promise<{ default: ComponentType<any> }>
) =>
    lazy(async () => {
        const pageHasAlreadyBeenReloaded = JSON.parse(
            window.sessionStorage.getItem("page-has-been-reloaded") || "false"
        );

        try {
            return await componentImport();
        } catch (error) {
            if (!pageHasAlreadyBeenReloaded) {
                // Determine if this is a chunk loading error
                const isChunkError =
                    error instanceof TypeError ||
                    (error as Error).message?.includes("fetch") ||
                    (error as Error).message?.includes("import");

                if (isChunkError) {
                    console.warn("Chunk loading failed. Refreshing page to get latest assets...");
                    window.sessionStorage.setItem("page-has-been-reloaded", "true");
                    window.location.reload();
                    return { default: () => null } as any; // Dummy return while reloading
                }
            }

            // If already reloaded or not a fetch error, throw it
            console.error("Dynamic import error:", error);
            throw error;
        }
    });

// Clear the reload flag after a successful load (to allow future retries across sessions)
window.addEventListener('load', () => {
    // We keep it for the session to prevent infinite reload loops if something is truly broken
    // but we can clear it if we want to be aggressive. 
    // For now, staying safe and letting session storage persist.
});
