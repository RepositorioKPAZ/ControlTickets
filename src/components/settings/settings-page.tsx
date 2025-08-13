import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountryList } from "./country-list";
import { RequestTypeList } from "./request-type-list";
import { HolidayList } from "../holidays/holiday-list";
import { ClientList } from "../clients/client-list";
import { ResolverList } from "./resolver-list";
import { Settings, Globe, FileText, Calendar, Users, UserCog } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
      </div>
      
      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="countries" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Países</span>
          </TabsTrigger>
          <TabsTrigger value="request-types" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Tipos de Solicitud</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="resolvers" className="flex items-center space-x-2">
            <UserCog className="h-4 w-4" />
            <span>Resolutores</span>
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Días Feriados</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="countries">
          <CountryList />
        </TabsContent>
        
        <TabsContent value="request-types">
          <RequestTypeList />
        </TabsContent>
        
        <TabsContent value="clients">
          <ClientList />
        </TabsContent>
        
        <TabsContent value="resolvers">
          <ResolverList />
        </TabsContent>
        
        <TabsContent value="holidays">
          <HolidayList />
        </TabsContent>
      </Tabs>
    </div>
  );
}