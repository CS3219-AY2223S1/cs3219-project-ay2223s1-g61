import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './components/SignupPage';
import { UserContext } from './hooks/UserContext';
import { RequireAuth, RoutePath } from './services/RoutingService';
import useTokenLogin from './hooks/useTokenLogin';
import AccountPage from './pages/Account/Account';
import NotFoundPage from './pages/NotFoundPage';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import HomePage from './pages/Home';
import InterviewPage from './pages/InterviewPage';

const theme = createTheme({
  palette: {
    primary: {
      light: '#474DD9',
      main: '#474DD9',
      dark: '#4347cb',
    },
    secondary: {
      light: '#fff',
      main: '#fff',
      dark: '#fff',
    },
  },
});

function App() {
  const { user, setUser, isLoading } = useTokenLogin();
  return (
    <div className="App">
      <UserContext.Provider value={{ user, setUser, isLoading }}>
        <ThemeProvider theme={theme}>
          <Router>
            <Routes>
              <Route path={RoutePath.BASE} element={<Navigate replace to={RoutePath.SIGNUP} />} />
              <Route path={RoutePath.SIGNUP} element={<SignupPage />} />
              <Route path={RoutePath.ACCOUNT} element={<AccountPage />} />
              <Route
                path={RoutePath.HOME}
                element={
                  <RequireAuth>
                    <HomePage />
                  </RequireAuth>
                }
              />
              <Route
                path={RoutePath.INTERVIEW}
                element={
                  <RequireAuth>
                    <InterviewPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </UserContext.Provider>
    </div>
  );
}

export default App;
