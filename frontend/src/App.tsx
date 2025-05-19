import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ConfigRoutes from './routes';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/frontend">
        <ConfigRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
