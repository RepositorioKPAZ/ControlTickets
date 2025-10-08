import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientTicketsReport } from "./client-tickets-report";
import { ResolverTicketsReport } from "./resolver-tickets-report";
import { TicketDetailReport } from "./ticket-detail-report";
import { ResolutionTimeReport } from "./resolution-time-report";
import { ClientResolutionTimeReport } from "./client-resolution-time-report";
import { FileBarChart, Users, UserCog, FileText, Clock } from "lucide-react";

export function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileBarChart className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Reportes del Sistema</h1>
      </div>
      
      <Tabs defaultValue="client-tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="client-tickets" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Tickets por Cliente</span>
          </TabsTrigger>
          <TabsTrigger value="resolver-tickets" className="flex items-center space-x-2">
            <UserCog className="h-4 w-4" />
            <span>Tickets por Resolutor</span>
          </TabsTrigger>
          <TabsTrigger value="ticket-details" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reporte Detallado</span>
          </TabsTrigger>
          <TabsTrigger value="resolution-time" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Tiempo de Resolución</span>
          </TabsTrigger>
          <TabsTrigger value="client-resolution-time" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Tiempo por Cliente</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="client-tickets">
          <ClientTicketsReport />
        </TabsContent>
        
        <TabsContent value="resolver-tickets">
          <ResolverTicketsReport />
        </TabsContent>
        
        <TabsContent value="ticket-details">
          <TicketDetailReport />
        </TabsContent>
        
        <TabsContent value="resolution-time">
          <ResolutionTimeReport />
        </TabsContent>
        <TabsContent value="client-resolution-time">
          <ClientResolutionTimeReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}