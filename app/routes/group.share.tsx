import { useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/group.share";
import { getGroup, markGroupShared } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2 } from "lucide-react";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const group = getGroup(params.groupId);
  if (!group) throw new Response("Group not found", { status: 404 });
  return { group };
}

export default function GroupSharePage({ loaderData }: Route.ComponentProps) {
  const { group } = loaderData;
  const navigate = useNavigate();
  const [step, setStep] = useState<"confirm" | "shared">(group.isShared ? "shared" : "confirm");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState(group.shareCode ?? "");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = `${origin}/join/${group.id}?name=${encodeURIComponent(group.name)}`;

  const formattedCode = currentCode.length === 6
    ? `${currentCode.slice(0, 3)} ${currentCode.slice(3)}`
    : currentCode;

  const handleStartSharing = async () => {
    setIsLoading(true);
    setError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch(`/api/shares/${group.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${code}`,
        },
        body: JSON.stringify(group),
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      markGroupShared(group.id, code, data.etag);
      setCurrentCode(code);
      setStep("shared");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to start sharing";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => navigator.clipboard.writeText(joinUrl);
  const copyCode = () => navigator.clipboard.writeText(currentCode);
  const copyBoth = () =>
    navigator.clipboard.writeText(
      `Join my TrueUp group '${group.name}': ${joinUrl}\nCode: ${currentCode}`
    );

  return (
    <DialogOrDrawer
      title={`Share ${group.name}`}
      open={true}
      onClose={() => navigate(-1)}
    >
      {step === "confirm" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Sharing this group will upload it to the cloud. Anyone with the link
            and 6-digit access code you create will be able to view this group
            on their own device and receive updates when you make changes.
          </p>
          <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
            <li>Group name: <strong>{group.name}</strong></li>
            <li>{group.people.length} people</li>
            <li>{group.expenses.length} expenses</li>
            <li>{group.transfers.length} transfers</li>
          </ul>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              size="xl"
              className="cursor-pointer"
              onClick={handleStartSharing}
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start sharing"}
            </Button>
            <Button
              size="xl"
              variant="muted"
              className="cursor-pointer"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <p className="text-sm text-muted-foreground text-center">
            Anyone with this link and the 6-digit code can view this group on
            their device.
          </p>
          <QRCodeSVG value={joinUrl} size={180} />
          <div className="flex w-full gap-2 items-center">
            <input
              readOnly
              value={joinUrl}
              className="flex-1 text-sm border rounded px-3 py-2 bg-muted text-muted-foreground overflow-hidden text-ellipsis"
            />
            <Button size="icon-lg" variant="muted" className="cursor-pointer shrink-0" onClick={copyLink}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex w-full items-center justify-between gap-4 bg-muted rounded-lg px-4 py-3">
            <span className="text-3xl font-mono font-bold tracking-widest">{formattedCode}</span>
            <Button size="icon-lg" variant="muted" className="cursor-pointer" onClick={copyCode}>
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col w-full gap-2">
            <Button size="xl" variant="muted" className="cursor-pointer" onClick={copyBoth}>
              <Share2 className="size-4" /> Re-share
            </Button>
            <Button size="xl" className="cursor-pointer" onClick={() => navigate(-1)}>
              Done
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="text-destructive cursor-pointer"
              onClick={() => navigate(`/${group.id}/share/stop`)}
            >
              Stop sharing
            </Button>
          </div>
        </div>
      )}
    </DialogOrDrawer>
  );
}
