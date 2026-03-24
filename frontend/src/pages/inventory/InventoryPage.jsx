import { useState } from 'react';
import { InventoryStatus } from './InventoryStatus';
import { InventoryLogs } from './InventoryLogs';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ListChecks, History } from "lucide-react";

export const InventoryPage = () => {
  return (
    <div className="page-container">
      <Tabs defaultValue="status" className="w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
            <p className="text-slate-400 text-sm">Monitor levels and audit inventory transaction history.</p>
          </div>
          <TabsList className="bg-slate-900 border border-slate-800 h-10 p-1">
            <TabsTrigger value="status" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white h-full px-4 text-xs">
              <ListChecks className="mr-2 h-4 w-4" /> Current Status
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white h-full px-4 text-xs">
              <History className="mr-2 h-4 w-4" /> Audit Logs
            </TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="status" className="mt-0 transition-all focus-visible:outline-none">
          <InventoryStatus />
        </TabsContent>
        <TabsContent value="logs" className="mt-0 transition-all focus-visible:outline-none">
          <InventoryLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
