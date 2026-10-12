"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";

export function SubmitButton(props: Omit<ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending || props.loading} {...props} />;
}
