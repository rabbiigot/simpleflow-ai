import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tent } from "lucide-react";
import React, { useEffect, useState } from "react";
import NativeSignUp from "./nativeSignIn";
import googleImg from "../../assets/google.png"

interface SignInContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignInContainer: React.FC<SignInContainerProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState<"email" | "form">("email");

  useEffect(() => {
    if (!open) {
      setStep("email");
    }
  }, [open]);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // const passwordsMatch =
  //   !form.password ||
  //   !form.confirmPassword ||
  //   form.password === form.confirmPassword;

  const handleEmailContinue = () => {
    if (!form.email) return;
    setStep("form");
  };

  const handleGoogleSignIn = () => {
    // 👉 Call your Google OAuth flow here
    console.log("Proceeding with Google Sign-In");
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!passwordsMatch) return;

  //   const payload = {
  //     email: form.email,
  //     firstName: form.firstName,
  //     lastName: form.lastName,
  //     phoneNumber: form.phoneNumber,
  //     country: form.country,
  //     address: form.address,
  //     password: form.password,
  //   };

  //   console.log("Submitting user:", payload);

  //   // API call here

  //   onOpenChange(false);
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        {/* STEP 1 — EMAIL */}
        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Create your account</DialogTitle>
              <DialogDescription>
                Enter your email to continue or sign up with Google.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button onClick={handleEmailContinue} className="bg-orange-500">
                <Tent className="mr-1 h-5 w-5" />
                Continue Simpleflow sign up
              </Button>

              <div className="relative text-center text-sm text-muted-foreground">
                <span className="bg-background px-2">or</span>
              </div>

              <Button
                variant="outline"
                type="button"
                className="hover:cursor-pointer"
                onClick={handleGoogleSignIn}
              >
                <img
                  src={googleImg}
                  alt="Google Icon"
                  className="mr-1 h-5 w-5"
                />
                Continue with Google
              </Button>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}

        {/* STEP 2 — FULL FORM */}
        {step === "form" && (
          <>
            <NativeSignUp />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInContainer;
