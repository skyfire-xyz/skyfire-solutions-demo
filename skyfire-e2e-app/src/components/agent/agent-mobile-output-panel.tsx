import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import { type AgentType } from "@/lib/types";

interface MobileOutputPanelProps {
  selectedAgent: AgentType;
  loading: boolean;
  outputDrawerOpen: boolean;
  setOutputDrawerOpen: (open: boolean) => void;
  children: React.ReactNode;
}

export function MobileOutputPanel({
  selectedAgent,
  loading,
  outputDrawerOpen,
  setOutputDrawerOpen,
  children,
}: MobileOutputPanelProps) {
  return (
    <>
      <Drawer open={outputDrawerOpen} onOpenChange={setOutputDrawerOpen}>
        <DrawerContent className="flex flex-col rounded-t-[10px] h-[96vh] fixed bottom-0 left-0 right-0">
          <DrawerHeader className="flex-none border-b px-4 py-3">
            <DrawerTitle className="flex items-center justify-between gap-2 text-xs font-medium">
              <span>
                {loading ? "Processing..." : `${selectedAgent.name} Output`}
              </span>
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col">{children}</div>
            ) : (
              <div className="min-h-full">{children}</div>
            )}
          </div>

          <DrawerFooter className="flex-none border-t px-4 py-3">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
