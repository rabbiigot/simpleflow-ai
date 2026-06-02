import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState, type ImgHTMLAttributes } from "react";

type ImageWithLoaderProps = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
};

export function ImageWithLoader({
  className,
  wrapperClassName,
  alt,
  ...props
}: ImageWithLoaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn("relative", wrapperClassName)}>
      {!loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        className={cn(
          className,
          !loaded && !errored && "invisible",
        )}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        {...props}
      />
    </div>
  );
}
