"use client";

import { Suspense } from "react";
import ResetPasswordPage from "./ResetPassContent";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordPage />
    </Suspense>
  );
}