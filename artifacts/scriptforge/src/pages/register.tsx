import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, RefreshCw } from "lucide-react";

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a + b, question: `What is ${a} + ${b}?` };
}

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    repeatPassword: z.string(),
    captcha: z.string().min(1, "Please answer the captcha"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service",
    }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      repeatPassword: "",
      captcha: "",
      terms: false,
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Account created!", description: `Welcome, ${data.user.username}!` });
        setLocation("/");
      },
      onError: (error: unknown) => {
        const msg =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Registration failed. Please try again.";
        toast({ title: "Registration failed", description: msg, variant: "destructive" });
      },
    },
  });

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    form.setValue("captcha", "");
    setCaptchaError("");
  };

  const onSubmit = (values: FormValues) => {
    const userAnswer = parseInt(values.captcha, 10);
    if (userAnswer !== captcha.answer) {
      setCaptchaError("Incorrect answer, please try again");
      refreshCaptcha();
      return;
    }
    setCaptchaError("");
    registerMutation.mutate({
      data: {
        email: values.email,
        username: values.username,
        password: values.password,
        captchaToken: "valid",
      },
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-3xl font-bold text-primary leading-none">0.1s</span>
              <span className="text-xl font-bold text-foreground leading-none self-end pb-0.5">Dev</span>
            </Link>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Join the script sharing community</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="YourUsername"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      This will be your public display name
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repeatPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-repeat-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Captcha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Human Verification
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-none px-4 py-2 bg-muted rounded-md font-mono text-sm font-bold select-none">
                    {captcha.question}
                  </div>
                  <FormField
                    control={form.control}
                    name="captcha"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-0">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Answer"
                            data-testid="input-captcha"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {captchaError && (
                  <p className="text-sm font-medium text-destructive">{captchaError}</p>
                )}
              </div>

              {/* Terms */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline font-medium">
                          Terms of Service
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
