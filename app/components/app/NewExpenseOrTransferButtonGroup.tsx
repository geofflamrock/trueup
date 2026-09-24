import type { Group } from "~/types";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { Banknote, HandCoins } from "lucide-react";

type NewExpenseOrTransferButtonGroupProps = {
    group: Group;
};

export function NewExpenseOrTransferButtonGroup({ group }: NewExpenseOrTransferButtonGroupProps) {
    return <div className="flex flex-row gap-2 justify-center">
        <Button
            variant="default"
            size="lg"
            render={<Link
                to={`/${group.id}/expenses/new`}
                prefetch="viewport"
                className="cursor-pointer"
            >
                <Banknote /> New expense
            </Link>} />
        <Button
            variant="muted"
            size="lg"
            render={<Link
                to={`/${group.id}/transfers/new`}
                prefetch="viewport"
                className="cursor-pointer"
            >
                <HandCoins /> New transfer
            </Link>} />
    </div>;
}