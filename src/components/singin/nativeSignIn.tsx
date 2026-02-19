import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const NativeSignUp = () => {
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

  const passwordsMatch =
    !form.password ||
    !form.confirmPassword ||
    form.password === form.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form>
      <DialogHeader>
        <DialogTitle>Complete your profile</DialogTitle>
        <DialogDescription>Finish setting up your account.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <Input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Last name</Label>
            <Input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <Label>Password</Label>
          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label>Confirm password</Label>
          <Input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {!passwordsMatch && (
            <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!passwordsMatch}>
          Create account
        </Button>
      </DialogFooter>
    </form>
  );
};

export default NativeSignUp;
