
import { useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';

import BottomNav from './components/BottomNav';
import { ErrorNotice } from './components/Page';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import GuideRegisterScreen from './screens/GuideRegisterScreen';

import {
  CatalogScreen,
  HotelDetailScreen,
  GuidesCatalogScreen,
  GuideDetailScreen,
} from './screens/CatalogScreens';

import {
  AccountScreen,
  EditAccountScreen,
  PasswordScreen,
} from './screens/AccountScreens';

import {
  DraftScreen,
  ReservationsListScreen,
} from './screens/ReservationScreens';

import UnavailableScreen from './screens/UnavailableScreen';

function RequireAuth() {
  const { user, loading, unavailable, retry, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p role="status" className="notice m-6">
        Verificando sua sessão...
      </p>
    );
  }

  if (unavailable) {
    return (
      <div className="p-6">
        <ErrorNotice
          message="Não foi possível verificar sua sessão. Tente novamente para continuar."
          retry={() => void retry()}
        />

        <button
          className="secondary-button w-full mt-4"
          onClick={() => logout()}
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return user ? (
    <Outlet key={user.id_usuario} />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname }}
    />
  );
}

function Layout() {
  const location = useLocation();

  const rootTabs = [
    '/app/home',
    '/app/explore',
    '/app/search',
    '/app/guides',
    '/app/reservations',
    '/app/profile',
  ];

  return (
    <>
      <Outlet />

      {rootTabs.includes(location.pathname) && <BottomNav />}
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  return <ScrollReset pathname={pathname} />;
}

function ScrollReset({ pathname }: { pathname: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);

    document
      .getElementById('main-content')
      ?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <HashRouter>
          <ScrollToTop />

          <div className="min-h-screen w-full bg-white">
            <div className="relative w-full min-h-screen bg-white">
              <button
                className="skip-link"
                onClick={() =>
                  document.getElementById('main-content')?.focus()
                }
              >
                Ir para o conteúdo
              </button>

              <main
                id="main-content"
                tabIndex={-1}
                className="outline-none w-full min-h-screen"
              >
                <Routes>
                  <Route path="/" element={<SplashScreen />} />

                  <Route
                    path="/onboarding"
                    element={<OnboardingScreen />}
                  />

                  <Route
                    path="/login"
                    element={<LoginScreen />}
                  />

                  <Route
                    path="/register"
                    element={<RegisterScreen />}
                  />

                  <Route
                    path="/register/guia"
                    element={<GuideRegisterScreen />}
                  />

                  <Route
                    path="/forgot-password"
                    element={
                      <UnavailableScreen
                        title="Recuperar senha"
                        message="A recuperação de senha por e-mail ainda está em desenvolvimento. Nenhum e-mail será enviado nesta etapa."
                      />
                    }
                  />

                  <Route
                    path="/verify-2fa"
                    element={
                      <UnavailableScreen
                        title="Verificação em duas etapas"
                      />
                    }
                  />

                  <Route
                    path="/guia/*"
                    element={
                      <UnavailableScreen title="Área do guia" />
                    }
                  />

                  <Route
                    path="/hotel/*"
                    element={
                      <UnavailableScreen
                        title="Área da hospedagem"
                        message="O cadastro de hospedagens e o vínculo dos gestores exigem administração do sistema. O painel de hospedagem será implementado em uma próxima etapa."
                      />
                    }
                  />

                  <Route path="/app" element={<Layout />}>
                    <Route
                      index
                      element={<Navigate to="home" replace />}
                    />

                    <Route
                      path="home"
                      element={<CatalogScreen />}
                    />

                    <Route
                      path="explore"
                      element={<CatalogScreen explore />}
                    />

                    <Route
                      path="search"
                      element={<CatalogScreen explore />}
                    />

                    <Route
                      path="favorites"
                      element={<CatalogScreen favoritesOnly />}
                    />

                    <Route
                      path="hotel/:id"
                      element={<HotelDetailScreen />}
                    />

                    <Route
                      path="hotel/:id/rooms"
                      element={<HotelDetailScreen roomsOnly />}
                    />

                    <Route
                      path="hotel/:id/room/:roomId"
                      element={<HotelDetailScreen roomOnly />}
                    />

                    <Route
                      path="guides"
                      element={<GuidesCatalogScreen />}
                    />

                    <Route
                      path="guide/:id"
                      element={<GuideDetailScreen />}
                    />

                    <Route element={<RequireAuth />}>
                      <Route
                        path="profile"
                        element={<AccountScreen />}
                      />

                      <Route
                        path="edit-profile"
                        element={<EditAccountScreen />}
                      />

                      <Route
                        path="security"
                        element={<PasswordScreen />}
                      />

                      <Route
                        path="reservations"
                        element={<ReservationsListScreen />}
                      />

                      <Route
                        path="booking"
                        element={<DraftScreen />}
                      />
                    </Route>

                    <Route
                      path="payment"
                      element={
                        <UnavailableScreen
                          title="Pagamentos"
                          message="O pagamento de reservas ainda não está disponível. Nenhum dado de cartão é solicitado nem há cobrança nesta etapa."
                        />
                      }
                    />

                    <Route
                      path="confirmation"
                      element={
                        <UnavailableScreen
                          title="Confirmação de reserva"
                          message="Nenhuma hospedagem foi confirmada por esta tela. Consulte seus rascunhos em Minhas reservas."
                        />
                      }
                    />

                    <Route
                      path="*"
                      element={<UnavailableScreen />}
                    />
                  </Route>

                  <Route
                    path="*"
                    element={
                      <UnavailableScreen
                        title="Página não encontrada"
                        message="Este endereço não corresponde a uma tela disponível."
                      />
                    }
                  />
                </Routes>
              </main>
            </div>
          </div>
        </HashRouter>
      </CatalogProvider>
    </AuthProvider>
  );
}
