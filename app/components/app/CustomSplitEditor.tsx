import { useEffect, useState } from "react";
import { Calculator, Check, Delete } from "lucide-react";

import { DialogOrDrawer } from "~/components/app/DialogOrDrawer";
import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "~/components/ui/input-group";
import type { ExpenseShare, Person } from "~/types";
import { cn } from "~/lib/utils";

const numberRows = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", ".", "delete"],
] as const;

const rightColumnButtons = ["÷", "×", "-", "+", "apply"] as const;

const operatorPrecedence: Record<string, number> = {
  "+": 1,
  "-": 1,
  "×": 2,
  "÷": 2,
};

type CustomSplitEditorProps = {
  amount: string;
  people: Person[];
  shares: ExpenseShare[];
  onUpdateShare: (personId: number, value: string) => void;
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatAmount(value: number) {
  return roundCurrency(value)
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

function isOperator(token: string) {
  return token in operatorPrecedence;
}

function isNumberToken(token: string) {
  return /\d/.test(token) || token === ".";
}

function getTrailingNumber(expression: string) {
  let trailingNumber = "";

  for (let index = expression.length - 1; index >= 0; index -= 1) {
    const character = expression[index]!;

    if (isOperator(character)) {
      break;
    }

    trailingNumber = `${character}${trailingNumber}`;
  }

  return trailingNumber;
}

function insertToken(expression: string, token: string) {
  if (isNumberToken(token)) {
    if (token === ".") {
      const trailingNumber = getTrailingNumber(expression);
      if (trailingNumber.includes(".")) {
        return expression;
      }

      if (!expression || isOperator(expression.at(-1) ?? "")) {
        return `${expression}0${token}`;
      }
    }

    return `${expression}${token}`;
  }

  if (!expression) {
    return token === "-" ? token : expression;
  }

  if (isOperator(expression.at(-1) ?? "")) {
    return `${expression.slice(0, -1)}${token}`;
  }

  return `${expression}${token}`;
}

function getNextBracketToken(expression: string) {
  for (let index = expression.length - 1; index >= 0; index -= 1) {
    const character = expression[index];
    if (character === "(" || character === ")") {
      return character === "(" ? ")" : "(";
    }
  }

  return "(";
}

function sanitizeExpressionInput(rawValue: string) {
  return rawValue
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/[^0-9.+\-()×÷]/g, "");
}

function tokenizeExpression(expression: string) {
  const tokens: Array<number | string> = [];
  let index = 0;
  let expectsNumber = true;

  while (index < expression.length) {
    const character = expression[index]!;

    if (character === " ") {
      index += 1;
      continue;
    }

    if (expectsNumber) {
      if (character === "(") {
        tokens.push(character);
        index += 1;
        continue;
      }

      let sign = 1;
      if (character === "-") {
        sign = -1;
        index += 1;
      }

      let numberText = "";
      let hasDecimalSeparator = false;

      while (index < expression.length) {
        const currentCharacter = expression[index]!;

        if (/\d/.test(currentCharacter)) {
          numberText += currentCharacter;
          index += 1;
          continue;
        }

        if (currentCharacter === ".") {
          if (hasDecimalSeparator) {
            return null;
          }

          hasDecimalSeparator = true;
          numberText += ".";
          index += 1;
          continue;
        }

        break;
      }

      if (!numberText) {
        if (sign === -1 && expression[index] === "(") {
          tokens.push(-1);
          tokens.push("×");
          expectsNumber = true;
          continue;
        }

        return null;
      }

      const parsedNumber = Number.parseFloat(numberText);
      if (Number.isNaN(parsedNumber)) {
        return null;
      }

      tokens.push(sign * parsedNumber);
      expectsNumber = false;
      continue;
    }

    if (character === ")") {
      tokens.push(character);
      expectsNumber = false;
      index += 1;
      continue;
    }

    if (!isOperator(character)) {
      return null;
    }

    tokens.push(character);
    expectsNumber = true;
    index += 1;
  }

  return expectsNumber ? null : tokens;
}

function evaluateExpression(expression: string) {
  const tokens = tokenizeExpression(expression);
  if (!tokens) {
    return null;
  }

  const values: number[] = [];
  const operators: string[] = [];

  const applyOperator = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();

    if (!operator || left === undefined || right === undefined) {
      return false;
    }

    let nextValue: number;
    switch (operator) {
      case "+":
        nextValue = left + right;
        break;
      case "-":
        nextValue = left - right;
        break;
      case "×":
        nextValue = left * right;
        break;
      case "÷":
        if (right === 0) {
          return false;
        }
        nextValue = left / right;
        break;
      default:
        return false;
    }

    if (!Number.isFinite(nextValue)) {
      return false;
    }

    values.push(roundCurrency(nextValue));
    return true;
  };

  for (const token of tokens) {
    if (typeof token === "number") {
      values.push(token);
      continue;
    }

    if (token === "(") {
      operators.push(token);
      continue;
    }

    if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") {
        if (!applyOperator()) {
          return null;
        }
      }

      if (operators.pop() !== "(") {
        return null;
      }

      continue;
    }

    while (
      operators.length > 0 &&
      operators[operators.length - 1] !== "(" &&
      operatorPrecedence[operators[operators.length - 1]!] >=
        operatorPrecedence[token]
    ) {
      if (!applyOperator()) {
        return null;
      }
    }

    operators.push(token);
  }

  while (operators.length > 0) {
    if (operators[operators.length - 1] === "(") {
      return null;
    }

    if (!applyOperator()) {
      return null;
    }
  }

  return values.length === 1 ? roundCurrency(values[0]!) : null;
}

type SplitAmountCalculatorProps = {
  personName: string;
  initialAmount: number;
  open: boolean;
  onClose: () => void;
  onApply: (value: number) => void;
};

function SplitAmountCalculator({
  personName,
  initialAmount,
  open,
  onClose,
  onApply,
}: SplitAmountCalculatorProps) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialAmount > 0) {
      const nextExpression = formatAmount(initialAmount);
      setExpression(nextExpression);
      setResult(roundCurrency(initialAmount));
      return;
    }

    setExpression("");
    setResult(null);
  }, [initialAmount, open]);

  const refreshResult = (nextExpression: string) => {
    const nextResult = evaluateExpression(nextExpression);
    setResult(nextResult);
  };

  const handleTokenPress = (token: string) => {
    let nextExpression = expression;

    if (token === "()") {
      nextExpression = `${expression}${getNextBracketToken(expression)}`;
      setExpression(nextExpression);
      refreshResult(nextExpression);
      return;
    }

    if (isOperator(token)) {
      nextExpression = insertToken(expression, token);
    } else if (isNumberToken(token)) {
      nextExpression = insertToken(expression, token);
    }

    if (nextExpression === expression) {
      return;
    }

    setExpression(nextExpression);
    if (isNumberToken(token)) {
      refreshResult(nextExpression);
    }
  };

  const handleBackspace = () => {
    const nextExpression = expression.slice(0, -1);
    setExpression(nextExpression);
    refreshResult(nextExpression);
  };

  const handleClear = () => {
    setExpression("");
    setResult(null);
  };

  const handleInputChange = (value: string) => {
    const sanitizedExpression = sanitizeExpressionInput(value);
    setExpression(sanitizedExpression);
    refreshResult(sanitizedExpression);
  };

  const handleApplyAmount = () => {
    if (result === null || result < 0) {
      return;
    }

    onApply(roundCurrency(result));
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleApplyAmount();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const allowedControlKeys = new Set([
      "Backspace",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
      "Delete",
    ]);

    if (allowedControlKeys.has(event.key)) {
      return;
    }

    if (/^[0-9.+\-()×÷/*]$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  };

  const isApplyDisabled = result === null || result < 0;

  return (
    <DialogOrDrawer
      title={`Custom split: ${personName}`}
      open={open}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <InputGroup>
          <InputGroupInput
            type="text"
            value={expression}
            placeholder="0"
            className="text-right text-base font-medium"
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <InputGroupAddon align="inline-end" className="gap-1 pr-4">
            <InputGroupText>=</InputGroupText>
            <InputGroupText className="font-medium text-foreground">
              {result === null ? "--" : formatAmount(result)}
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>

        <div className="grid grid-cols-4 gap-2">
          <Button
            type="button"
            variant="muted"
            size="lg"
            className="h-14"
            onClick={handleClear}
          >
            AC
          </Button>

          <div aria-hidden className="h-14" />

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="h-14 text-2xl"
            onClick={() => handleTokenPress("()")}
          >
            ()
          </Button>

          {rightColumnButtons.map((token, index) => {
            const isApplyButton = token === "apply";

            return (
              <Button
                key={token}
                type="button"
                variant={isApplyButton ? "default" : "secondary"}
                size="lg"
                className={cn("h-14", {
                  "text-2xl": !isApplyButton,
                })}
                disabled={isApplyButton ? isApplyDisabled : false}
                onClick={() => {
                  if (isApplyButton) {
                    handleApplyAmount();
                    return;
                  }

                  handleTokenPress(token);
                }}
                aria-label={isApplyButton ? "Apply amount" : undefined}
                style={{ gridColumnStart: 4, gridRowStart: index + 1 }}
              >
                {isApplyButton ? <Check /> : token}
              </Button>
            );
          })}

          {numberRows.flat().map((token, index) => {
            const row = Math.floor(index / 3) + 2;
            const column = (index % 3) + 1;

            if (token === "delete") {
              return (
                <Button
                  key={token}
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-14"
                  onClick={handleBackspace}
                  disabled={!expression}
                  aria-label="Delete"
                  style={{ gridColumnStart: column, gridRowStart: row }}
                >
                  <Delete />
                </Button>
              );
            }

            return (
              <Button
                key={token}
                type="button"
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={() => handleTokenPress(token)}
                style={{ gridColumnStart: column, gridRowStart: row }}
              >
                {token}
              </Button>
            );
          })}
        </div>
      </div>
    </DialogOrDrawer>
  );
}

export function CustomSplitEditor({
  amount,
  people,
  shares,
  onUpdateShare,
}: CustomSplitEditorProps) {
  const [calculatorPersonId, setCalculatorPersonId] = useState<number | null>(
    null,
  );

  const activePerson =
    calculatorPersonId === null
      ? null
      : (people.find((person) => person.id === calculatorPersonId) ?? null);
  const activeShare =
    activePerson === null
      ? null
      : (shares.find((share) => share.personId === activePerson.id) ?? null);

  const totalShares = shares.reduce((sum, share) => sum + share.amount, 0);
  const parsedAmount = Number.parseFloat(amount);
  const hasAmount = amount.length > 0 && !Number.isNaN(parsedAmount);
  const isValid = hasAmount && Math.abs(totalShares - parsedAmount) < 0.01;

  return (
    <>
      <div className="flex flex-col gap-2">
        {people.map((person) => {
          const share = shares.find(
            (currentShare) => currentShare.personId === person.id,
          );

          return (
            <div key={person.id} className="flex items-center gap-2">
              <p className="flex-1">{person.name}</p>
              <InputGroup className="w-40">
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  type="number"
                  value={share?.amount}
                  onChange={(event) =>
                    onUpdateShare(person.id, event.target.value)
                  }
                  step="0.01"
                  min="0"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={`Open calculator for ${person.name}`}
                    onClick={() => setCalculatorPersonId(person.id)}
                  >
                    <Calculator />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        Total: ${totalShares.toFixed(2)}
        {!isValid && hasAmount && (
          <span className="ml-2 text-destructive">
            (must equal ${parsedAmount.toFixed(2)})
          </span>
        )}
      </div>

      {activePerson && (
        <SplitAmountCalculator
          open
          personName={activePerson.name}
          initialAmount={activeShare?.amount ?? 0}
          onClose={() => setCalculatorPersonId(null)}
          onApply={(value) => {
            onUpdateShare(activePerson.id, value.toFixed(2));
            setCalculatorPersonId(null);
          }}
        />
      )}
    </>
  );
}
