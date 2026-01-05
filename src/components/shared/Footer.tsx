export default function Footer() {
    return (
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl">
                <span className="text-xl font-bold text-white">G</span>
              </div>
              <span className="text-3xl font-bold">Game Universe</span>
            </div>
            <p className="mb-8 text-lg text-gray-300">
              La plateforme complète pour explorer l'univers du jeu vidéo
            </p>
            <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
            <div className="text-sm text-gray-400">© 2024 Game Universe. Tous droits réservés.</div>
          </div>
        </div>
      </footer>
    );
}