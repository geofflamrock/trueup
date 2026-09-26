import type { Group } from "~/types";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { Banknote, HandCoins } from "lucide-react";

export function NewExpenseOrTransferButtons({ group }: { group: Group }) {
    return (
        <div className="mt-4 flex flex-row justify-center gap-2">
            <Button
                variant="default"
                size="lg"
                render={
                    <Link
                        to={`/${group.id}/expenses/new`}
                        prefetch="viewport"
                        className="cursor-pointer"
                    >
                        <Banknote /> New expense
                    </Link>
                }
            />
            <Button
                variant="secondary"
                size="lg"
                render={
                    <Link
                        to={`/${group.id}/transfers/new`}
                        prefetch="viewport"
                        className="cursor-pointer"
                    >
                        <HandCoins /> New transfer
                    </Link>
                }
            />
        </div>
    );
}