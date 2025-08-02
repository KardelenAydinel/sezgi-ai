import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import {
  PersonOutline,
  Business,
  Send,
  Search,
  ShoppingCart,
  Headphones,
  Watch,
  PhoneIphone,
} from '@mui/icons-material';

const WelcomeScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const navigateToChat = (initialMessage?: string) => {
    navigate('/chat', { state: { initialMessage } });
  };

  const searchWithExample = (exampleText: string) => {
    setSearchText(exampleText);
    navigateToChat(exampleText);
  };

  const exampleSearches = [
    'Spor için kablosuz kulaklık',
    'Akıllı saat önerisi',
    'Gaming laptop',
    'iPhone aksesuar',
  ];

  const categoryCards = [
    { icon: <Headphones />, title: 'Elektronik', color: '#FF5722' },
    { icon: <Watch />, title: 'Akıllı Saatler', color: '#2196F3' },
    { icon: <PhoneIphone />, title: 'Telefon', color: '#4CAF50' },
    { icon: <ShoppingCart />, title: 'Moda', color: '#9C27B0' },
  ];

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <PersonOutline sx={{ color: 'orange', fontSize: 28, mr: 'auto' }} />
          <Button
            variant="outlined"
            startIcon={<Business />}
            size="small"
            onClick={() => navigate('/business')}
            sx={{
              borderColor: 'grey.400',
              color: 'grey.600',
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '12px',
            }}
          >
            Satıcı Girişi
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Hayalindeki Ürünü
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
            Tarif Et, Biz Bulalım!
          </Typography>
          <Typography variant="h6" sx={{ color: 'grey.600', mb: 4 }}>
            AI destekli alışveriş asistanın ile istediğin ürünü kolayca bul
          </Typography>

          {/* Search Bar */}
          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Hayalindeki ürünü tarif et..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  navigateToChat(searchText);
                }
              }}
              InputProps={{
                sx: { borderRadius: '24px' },
                endAdornment: (
                  <IconButton onClick={() => navigateToChat(searchText)}>
                    <Send />
                  </IconButton>
                ),
              }}
            />
          </Box>

          {/* Example Searches */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {exampleSearches.map((example, index) => (
              <Chip
                key={index}
                label={example}
                variant="outlined"
                clickable
                onClick={() => searchWithExample(example)}
                sx={{ borderRadius: '16px' }}
              />
            ))}
          </Box>
        </Box>

        {/* Category Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {categoryCards.map((category, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card 
                sx={{ 
                  textAlign: 'center', 
                  py: 3, 
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' }
                }}
                onClick={() => searchWithExample(category.title)}
              >
                <CardContent>
                  <Box sx={{ color: category.color, mb: 1 }}>
                    {React.cloneElement(category.icon, { fontSize: 'large' })}
                  </Box>
                  <Typography variant="h6" component="h3">
                    {category.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Features Section */}
        <Box textAlign="center">
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Neden Bizi Seçmelisin?
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box>
                <Search sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Akıllı Arama
                </Typography>
                <Typography sx={{ color: 'grey.600' }}>
                  AI ile istediğiniz ürünü doğal dilde tarif ederek bulun
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <ShoppingCart sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Kişiselleştirilmiş Öneriler
                </Typography>
                <Typography sx={{ color: 'grey.600' }}>
                  Size özel ürün önerileri ve karşılaştırmalar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <PersonOutline sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  7/24 Asistan
                </Typography>
                <Typography sx={{ color: 'grey.600' }}>
                  Her zaman yanınızda olan AI alışveriş asistanı
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default WelcomeScreen; 