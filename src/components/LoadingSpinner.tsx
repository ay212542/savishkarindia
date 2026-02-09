import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
};
