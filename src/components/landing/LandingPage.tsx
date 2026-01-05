"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGamepad, FaSearch, FaInfoCircle, FaUsers, FaStar, FaChartLine } from "react-icons/fa";
import Footer from "../shared/Footer";

export function LandingPage() {
  const t = useTranslations("landing");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 py-24 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-blue-100 sm:text-2xl">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button
                size="lg"
                className="hover:shadow-3xl transform rounded-xl bg-white text-blue-600 shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-blue-50"
                asChild
              >
                <Link href="/auth?mode=signup">
                  <FaUsers className="mr-3 h-5 w-5" />
                  {t("cta.signup")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="transform rounded-xl border-2 border-white text-white shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:shadow-2xl"
                asChild
              >
                <Link href="/auth?mode=signin">{t("cta.login")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
              Fonctionnalités principales
            </h2>
            <p className="mx-auto mb-20 max-w-2xl text-lg leading-relaxed text-gray-600">
              Découvrez tout ce que Game Universe a à offrir pour enrichir votre expérience gaming
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group rounded-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardHeader className="pb-6 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaGamepad className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{t("features.library.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed text-gray-600">
                  {t("features.library.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group rounded-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardHeader className="pb-6 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaSearch className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{t("features.search.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed text-gray-600">
                  {t("features.search.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group rounded-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardHeader className="pb-6 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaInfoCircle className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{t("features.details.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed text-gray-600">
                  {t("features.details.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">Nos statistiques</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Des chiffres qui témoignent de notre engagement envers la communauté gaming
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="group rounded-xl border-0 bg-white/80 text-center backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaGamepad className="h-10 w-10 text-white" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900">10,000+</div>
                <div className="text-lg text-gray-600">Jeux référencés</div>
              </CardContent>
            </Card>

            <Card className="group rounded-xl border-0 bg-white/80 text-center backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaStar className="h-10 w-10 text-white" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900">50,000+</div>
                <div className="text-lg text-gray-600">Évaluations</div>
              </CardContent>
            </Card>

            <Card className="group rounded-xl border-0 bg-white/80 text-center backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white">
              <CardContent className="p-8">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  <FaChartLine className="h-10 w-10 text-white" />
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900">1,000+</div>
                <div className="text-lg text-gray-600">Nouveaux jeux/mois</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 py-24 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8 lg:px-12">
          <h2 className="mb-6 text-4xl font-bold sm:text-5xl">
            Prêt à commencer votre aventure gaming ?
          </h2>
          <p className="mb-12 text-xl leading-relaxed text-blue-100">
            Rejoignez des milliers de gamers qui utilisent déjà Game Universe pour découvrir leurs
            prochains jeux favoris
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button
              size="lg"
              className="hover:shadow-3xl transform rounded-xl bg-white text-blue-600 shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-blue-50"
              asChild
            >
              <Link href="/auth?mode=signup">
                <FaUsers className="mr-3 h-5 w-5" />
                {t("cta.signup")}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="transform rounded-xl border-2 border-white text-white shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:shadow-2xl"
              asChild
            >
              <Link href="/auth?mode=signin">{t("cta.login")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
