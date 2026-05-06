import { useLoaderData, useNavigate, Link } from "react-router";
import type { Route } from "./+types/join.$shareId";
import { saveJoinedGroup } from "../storage";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "~/components/ui/field";
import { PageLayout } from "~/components/app/PageLayout";
import { ArrowLeft } from "lucide-react";
import type { Group } from "~/types";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "True Up: Join Group" },
    { name: "description", content: "Join a shared TrueUp group" },
  ];
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "Shared Group";
  return { shareId: params.shareId, name };
}

export default function JoinPage({ loaderData }: Route.ComponentProps) {
  const { shareId, name } = loaderData;
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        headers: { Authorization: `Bearer ${code}` },
      });
      if (res.status === 401) {
        setError("Invalid code. Please check and try again.");
        return;
      }
      if (!res.ok) {
        setError("This share link is no longer active.");
        return;
      }
      const etag = res.headers.get("ETag");
      const groupData: Group = await res.json();
      saveJoinedGroup(groupData, code, etag ?? undefined);
      navigate(`/${groupData.id}`);
    } catch {
      setError("Failed to join group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      header={
        <div className="flex gap-4 items-center p-4">
          <Button
            variant="muted"
            size="icon-lg"
            render={<Link to="/" prefetch="viewport" className="cursor-pointer"><ArrowLeft className="size-6" /></Link>}
          />
          <h1 className="text-2xl font-title text-foreground">Join Group</h1>
        </div>
      }
    >
      <div className="p-4">
        <FieldSet>
          <FieldGroup>
            <p className="text-muted-foreground">
              You've been invited to join <strong>{name}</strong>. Enter the
              6-digit code from the person who shared it with you.
            </p>
            <Field>
              <FieldLabel>Access Code</FieldLabel>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                pattern={REGEXP_ONLY_DIGITS}
                containerClassName="w-full"
              >
                <InputOTPGroup className="w-full">
                  <InputOTPSlot index={0} className="flex-1" />
                  <InputOTPSlot index={1} className="flex-1" />
                  <InputOTPSlot index={2} className="flex-1" />
                  <InputOTPSlot index={3} className="flex-1" />
                  <InputOTPSlot index={4} className="flex-1" />
                  <InputOTPSlot index={5} className="flex-1" />
                </InputOTPGroup>
              </InputOTP>
            </Field>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}
            <Button
              type="button"
              size="xl"
              className="cursor-pointer"
              disabled={isLoading || code.length !== 6}
              onClick={handleJoin}
            >
              {isLoading ? "Joining..." : "Join group"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </div>
    </PageLayout>
  );
}
