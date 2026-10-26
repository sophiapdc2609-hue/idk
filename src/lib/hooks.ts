import { useEffect, useState } from "react";
import { db } from "./db";
import { safeUrl } from "./files";
export function useFile(fileId?: string, image?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setUrl(image ? safeUrl(image) : undefined);
    if (fileId)
      db.files.get(fileId).then((f) => {
        if (f && active) {
          objectUrl = URL.createObjectURL(f.blob);
          setUrl(objectUrl);
        }
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, image]);
  return url;
}
