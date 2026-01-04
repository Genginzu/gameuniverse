"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaGamepad, FaPlus } from "react-icons/fa";
import Link from "next/link";

export function UserLibraryContent() {
  const t = useTranslations("library");
  const { user } = useAuth();
  const [userGames, setUserGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's games from API
    // For now, we'll show an empty state
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600">Gérez votre collection personnelle de jeux vidéo</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-2">
                <FaGamepad className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">Jeux possédés</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{userGames.length}</div>
            <p className="text-xs text-gray-500">Dans votre bibliothèque</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-green-100 p-2">
                <FaGamepad className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">Jeux terminés</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500">Complétés à 100%</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="rounded-lg bg-purple-100 p-2">
                <FaGamepad className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <CardTitle className="text-sm font-medium text-gray-900">Temps de jeu</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0h</div>
            <p className="text-xs text-gray-500">Total joué</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {userGames.length === 0 && (
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <FaGamepad className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">Votre bibliothèque est vide</h3>
            <p className="mb-6 max-w-md text-gray-500">
              Commencez à construire votre collection en explorant notre catalogue de jeux et en
              ajoutant vos favoris à votre bibliothèque.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/games">
                <FaPlus className="mr-2 h-4 w-4" />
                Explorer les jeux
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TODO: Add user games grid when user has games */}
    </>
  );
}
