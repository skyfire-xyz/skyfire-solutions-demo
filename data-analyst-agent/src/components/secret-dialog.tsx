// "use client";

// import { useState } from "react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useApp } from "@/context/app-provider";

// interface SecretDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function SecretDialog({ open, onOpenChange }: SecretDialogProps) {
//   const { setApiKey } = useApp();
//   const [inputValue, setInputValue] = useState("");
//   const [error, setError] = useState(false);

//   const handleSubmit = () => {
//     if (inputValue.trim()) {
//       setApiKey(inputValue.trim());
//       setError(false);
//       onOpenChange(false);
//     } else {
//       setError(true);
//     }
//   };

//   const handleOpenChange = (newOpen: boolean) => {
//     if (newOpen === false && !inputValue.trim()) {
//       return;
//     }
//     onOpenChange(newOpen);
//   };

//   return (
//     <AlertDialog open={open} onOpenChange={handleOpenChange}>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>API Key Required</AlertDialogTitle>
//           <AlertDialogDescription>
//             Please enter your Skyfire API key to continue. This key will be
//             stored in your browser session.
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <div className="grid gap-4 py-4">
//           <div className="grid gap-2">
//             <Label htmlFor="apiKey">API Key</Label>
//             <Input
//               id="apiKey"
//               value={inputValue}
//               onChange={(e) => {
//                 setInputValue(e.target.value);
//                 if (error) setError(false);
//               }}
//               placeholder="sk-..."
//               autoComplete="off"
//               className={error ? "border-red-500" : ""}
//             />
//             {error && (
//               <p className="text-sm text-red-500">API key is required</p>
//             )}
//           </div>
//         </div>
//         <AlertDialogFooter>
//           <AlertDialogAction onClick={handleSubmit}>Continue</AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }
