import { useState } from "react";
import { FileText, Download, ExternalLink, FileX, Eye, EyeOff, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttachedFilesProps {
  fileUrls: string[] | null;
}

const AttachedFiles = ({ fileUrls }: AttachedFilesProps) => {
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const hasFiles = fileUrls && fileUrls.length > 0 && fileUrls.some(f => f?.trim());

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("achievement-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
  };

  const getFileExtension = (path: string) => {
    return path.split(".").pop()?.toLowerCase() || "";
  };

  if (!hasFiles) {
    return (
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileX className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">No Files Attached</p>
            <p className="text-[11px] text-muted-foreground">The student did not upload any supporting documents</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Attached Files
      </p>
      <div className="space-y-2">
        {fileUrls!.filter(f => f?.trim()).map((filePath, i) => {
          const url = getFileUrl(filePath);
          const name = getFileName(filePath);
          const ext = getFileExtension(filePath);
          const isPdf = ext === "pdf";
          const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
          const canPreview = isPdf || isImage;
          const isPreviewOpen = previewPath === filePath;

          return (
            <div key={i} className="space-y-0">
              <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3 group">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isPdf ? "bg-destructive/10 text-destructive" : isImage ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {isImage ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{ext} file</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {canPreview && (
                    <button
                      onClick={() => setPreviewPath(isPreviewOpen ? null : filePath)}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${
                        isPreviewOpen
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                      title={isPreviewOpen ? "Hide preview" : "Preview"}
                    >
                      {isPreviewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {isPreviewOpen ? "Hide" : "Preview"}
                    </button>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={url}
                    download
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Inline Preview */}
              {isPreviewOpen && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden bg-background">
                  {isPdf ? (
                    <iframe
                      src={`${url}#toolbar=1&navpanes=0`}
                      className="w-full border-0"
                      style={{ height: "600px" }}
                      title={`Preview: ${name}`}
                    />
                  ) : isImage ? (
                    <div className="flex items-center justify-center p-4 bg-muted/30">
                      <img
                        src={url}
                        alt={name}
                        className="max-w-full max-h-[500px] rounded-lg object-contain"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttachedFiles;
