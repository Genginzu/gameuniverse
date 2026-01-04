"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGamepad, FaSearch, FaInfoCircle, FaUsers, FaStar, FaChartLine } from "react-icons/fa";

export function LandingPage() {
  const t = useTranslations("landing");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-xl text-blue-100 sm:text-2xl">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/auth?mode=signup">
                  <FaUsers className="mr-2 h-5 w-5" />
                  {t("cta.signup")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/auth?mode=signin">{t("cta.login")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Fonctionnalités principales
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-gray-600">
              Découvrez tout ce que Game Universe a à offrir pour enrichir votre expérience gaming
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FaGamepad className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t("features.library.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  {t("features.library.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <FaSearch className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{t("features.search.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  {t("features.search.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg transition-transform hover:scale-105">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <FaInfoCircle className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">{t("features.details.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  {t("features.details.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <FaGamepad className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">10,000+</div>
              <div className="text-gray-600">Jeux référencés</div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <FaStar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">50,000+</div>
              <div className="text-gray-600">Évaluations</div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <FaChartLine className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">1,000+</div>
              <div className="text-gray-600">Nouveaux jeux/mois</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Prêt à commencer votre aventure gaming ?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Rejoignez des milliers de gamers qui utilisent déjà Game Universe
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <Link href="/auth?mode=signup">
                <FaUsers className="mr-2 h-5 w-5" />
                {t("cta.signup")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/auth?mode=signin">{t("cta.login")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold">Game Universe</div>
            <p className="mb-6 text-gray-400">
              La plateforme complète pour explorer l'univers du jeu vidéo
            </p>
            <div className="text-sm text-gray-500">© 2024 Game Universe. Tous droits réservés.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
