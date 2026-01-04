"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGamepad, FaSearch, FaUser, FaCog } from "react-icons/fa";
import type { User } from "@supabase/supabase-js";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const t = useTranslations("dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {t("welcome", { name: user.user_metadata?.full_name || user.email })}
          </h1>
          <p className="text-lg text-gray-600">{t("title")}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">{t("quickActions")}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FaGamepad className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{t("browseLibrary")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full">
                  <Link href="/library">Parcourir</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <FaSearch className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">{t("searchGames")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/library?search=">Rechercher</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <FaUser className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">{t("profile")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/profile">Voir profil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <FaCog className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg">{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/settings">Paramètres</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity or Stats */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos dernières interactions avec la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Compte créé</p>
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dernière connexion</p>
                    <p className="text-xs text-gray-500">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("fr-FR")
                        : "Première connexion"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>Vos statistiques sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Jeux consultés</span>
                  <span className="text-sm text-gray-500">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Recherches effectuées</span>
                  <span className="text-sm text-gray-500">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Temps passé</span>
                  <span className="text-sm text-gray-500">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
