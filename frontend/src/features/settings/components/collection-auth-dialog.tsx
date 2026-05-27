import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { TemplateHighlightInput } from "@/components/shared";
import type { Collection } from "@/features/collections/types";
import type { RequestAuth, RequestAuthType } from "@/features/workspace/types";
import { useActiveEnvironment } from "@/features/workspace/stores";
import { buildTemplateValues } from "@/lib/utils";

type Props = {
  collection: Collection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (auth: RequestAuth) => Promise<void>;
};

export function CollectionAuthDialog({
  collection,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const activeEnvironment = useActiveEnvironment();
  const templateValues = buildTemplateValues(activeEnvironment?.variables ?? []);
  const [auth, setAuth] = useState<RequestAuth>({ type: "none", bearerToken: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!collection || !open) {
      return;
    }
    setAuth(collection.auth ?? { type: "none", bearerToken: "" });
  }, [collection, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(auth);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Collection auth</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Requests set to <span className="font-medium">Inherited</span> use this
          configuration for bearer authentication.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Auth type</div>
            <Select
              value={auth.type === "inherited" ? "none" : auth.type}
              onValueChange={(type: RequestAuthType) =>
                setAuth((current) => ({
                  ...current,
                  type: type === "inherited" ? "none" : type,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select auth type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {auth.type === "bearer" ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Bearer token</div>
              <TemplateHighlightInput
                value={auth.bearerToken}
                onChange={(bearerToken) =>
                  setAuth((current) => ({
                    ...current,
                    bearerToken,
                  }))
                }
                placeholder="Enter token or {{token_var}}"
                previewLabel="Template variable"
                templateValues={templateValues}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}