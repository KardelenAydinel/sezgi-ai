import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// --- DATA MODELS ---

enum Sender { user, llm }

class ChatMessage {
  final Sender sender;
  final String? text;
  final List<Product>? products;
  final int? numberOfCards;
  final List<EcommerceProduct>? searchResults; // E-ticaret arama sonuçları
  final TagGenerationResult? tagResult; // Tag generation sonuçları

  ChatMessage({
    required this.sender, 
    this.text, 
    this.products, 
    this.numberOfCards,
    this.searchResults,
    this.tagResult,
  });
}

class TagGenerationResult {
  final List<String> tags;
  final double confidence;
  final String category;
  final String reasoning;
  final String visualDescription;

  TagGenerationResult({
    required this.tags,
    required this.confidence,
    required this.category,
    required this.reasoning,
    required this.visualDescription,
  });
}

class Product {
  final String name;
  final String description;
  final String? imageBase64;
  final String? visualRepresentation; // Visual description alanı eklendi
  final double? similarityScore; // Cosine similarity percentage (0-1)
  final double? rating;
  final int? reviewCount;
  final String? subcategory;

  Product({
    required this.name, 
    required this.description, 
    this.imageBase64,
    this.visualRepresentation,
    this.similarityScore,
    this.rating,
    this.reviewCount,
    this.subcategory,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      name: json['urun_adi'] ?? 'İsimsiz Ürün',
      description: json['urun_aciklama'] ?? 'Açıklama yok.',
      imageBase64: json['image_base64'],
      visualRepresentation: json['visual_representation'], // Backend'den visual description al
      similarityScore: (json['similarity_score'] is num) ? (json['similarity_score'] as num).toDouble() : null,
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : null,
      reviewCount: json['review_count'] as int?,
      subcategory: json['subcategory'] as String?,
    );
  }

  ImageProvider get image {
    if (imageBase64 != null && imageBase64!.isNotEmpty) {
      try {
        Uint8List imageBytes = base64Decode(imageBase64!);
        return MemoryImage(imageBytes);
      } catch (e) {
        print("Error decoding base64 image: $e");
      }
    }
    return const AssetImage('assets/placeholder.png');
  }
}

class EcommerceProduct {
  final String id;
  final String name;
  final String description;
  final double price;
  final String currency;
  final String? imageUrl;
  final List<String> tags;
  final String category;
  final String? subcategory;
  final String? brand;
  final int stock;
  final double? rating;
  final int? reviewCount;
  final double? similarityScore; // Cosine similarity score

  EcommerceProduct({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.currency,
    this.imageUrl,
    required this.tags,
    required this.category,
    this.subcategory,
    this.brand,
    required this.stock,
    this.rating,
    this.reviewCount,
    this.similarityScore,
  });

  factory EcommerceProduct.fromJson(Map<String, dynamic> json) {
    return EcommerceProduct(
      id: json['id'] ?? '',
      name: json['name'] ?? 'İsimsiz Ürün',
      description: json['description'] ?? 'Açıklama yok.',
      price: (json['price'] ?? 0.0).toDouble(),
      currency: json['currency'] ?? 'TL',
      imageUrl: json['image_url'],
      tags: List<String>.from(json['tags'] ?? []),
      category: json['category'] ?? 'Genel',
      subcategory: json['subcategory'],
      brand: json['brand'],
      stock: json['stock'] ?? 0,
      rating: json['rating']?.toDouble(),
      reviewCount: json['review_count'],
      similarityScore: json['similarity_score']?.toDouble(),
    );
  }

  ImageProvider get image {
    // E-ticaret ürünleri için placeholder kullan (gerçek projede imageUrl kullanılır)
    return const AssetImage('assets/placeholder.png');
  }
}

// --- MAIN APP ---

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Görsel Alışveriş Asistanı',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
        useMaterial3: true,
        primarySwatch: Colors.orange,
        primaryColor: Colors.orange,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const WelcomeScreen(),
        '/business': (context) => const BusinessPanel(),
        '/ab-test-setup': (context) => ABTestSetupScreen(
          product: ModalRoute.of(context)!.settings.arguments as BusinessProduct,
        ),
      },
      onGenerateRoute: (settings) {
        // Handle dynamic routes with parameters
        if (settings.name == '/chat') {
          final args = settings.arguments as String?;
          return MaterialPageRoute(
            builder: (context) => MainScreen(initialMessage: args),
          );
        }
        if (settings.name == '/ab-test-results') {
          final args = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(
            builder: (context) => ABTestResultsScreen(
              product: args['product'],
              testField: args['testField'],
              aVariant: args['aVariant'],
              bVariant: args['bVariant'],
            ),
          );
        }
        return null;
      },
    );
  }
}

// --- MAIN SCREEN WITH ROLE SWITCHING ---

class MainScreen extends StatefulWidget {
  final String? initialMessage;
  
  const MainScreen({super.key, this.initialMessage});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  bool isBusinessMode = false;

  void _toggleMode() {
    setState(() {
      isBusinessMode = !isBusinessMode;
      if (isBusinessMode) {
        Navigator.pushNamed(context, '/business');
      } else {
        Navigator.pushReplacementNamed(context, '/');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isBusinessMode ? 'Satıcı Paneli' : 'Görsel Alışveriş Asistanı'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          PopupMenuButton<String>(
            icon: Icon(isBusinessMode ? Icons.business : Icons.shopping_cart),
            onSelected: (value) {
              if (value == 'toggle') {
                _toggleMode();
              }
            },
            itemBuilder: (BuildContext context) => [
              PopupMenuItem<String>(
                value: 'toggle',
                child: Row(
                  children: [
                    Icon(isBusinessMode ? Icons.shopping_cart : Icons.business),
                    const SizedBox(width: 8),
                    Text(isBusinessMode ? 'Alıcı Modu' : 'Satıcı Paneli'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: ChatPage(initialMessage: widget.initialMessage),
    );
  }
}

// --- CHAT PAGE WIDGET ---

class ChatPage extends StatefulWidget {
  final String? initialMessage;
  
  const ChatPage({super.key, this.initialMessage});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _showRetrySearchBar = false;

  @override
  void initState() {
    super.initState();
    // If there's an initial message, send it automatically
    if (widget.initialMessage != null && widget.initialMessage!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _controller.text = widget.initialMessage!;
        _sendMessage();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _addTagResultMessage(TagGenerationResult tagResult) {
    setState(() {
      // Eğer son mesaj loading ise onu replace et, değilse yeni ekle
      if (_messages.isNotEmpty && 
          _messages.last.sender == Sender.llm && 
          _messages.last.tagResult != null &&
          _messages.last.tagResult!.category == 'Loading...') {
        // Son mesaj loading ise onu replace et
        _messages[_messages.length - 1] = ChatMessage(
          sender: Sender.llm,
          tagResult: tagResult,
        );
      } else {
        // Normal mesaj ekle
        _messages.add(ChatMessage(
          sender: Sender.llm,
          tagResult: tagResult,
        ));
      }
    });
    _scrollToBottom();
  }

  void _addSearchResultsMessage(List<EcommerceProduct> searchResults) {
    setState(() {
      _messages.add(ChatMessage(
        sender: Sender.llm,
        searchResults: searchResults,
      ));
    });
    _scrollToBottom();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    // Add user message to chat
    setState(() {
      _messages.add(ChatMessage(sender: Sender.user, text: text));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final response = await http.post(
        Uri.parse('http://localhost:8000/gemini_suggestions'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'description': text}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('Raw response: $data');
        final List<dynamic> productList = data['products'];
        final int numberOfCards = data['number_of_cards'] ?? 4;
        print('Number of cards from response: $numberOfCards');
        print('Products list length: ${productList.length}');
        final products = productList.map((p) => Product.fromJson(p)).toList();
        print('Parsed products length: ${products.length}');
        setState(() {
          // First, add the text message
          _messages.add(ChatMessage(
            sender: Sender.llm,
            text: 'Sanırım ne demek istediğinizi anladım. Aklınızdaki \'o şey\' bunlardan biri olabilir mi?',
          ));
          // Then, add the products message
          _messages.add(ChatMessage(
            sender: Sender.llm, 
            products: products, 
            numberOfCards: numberOfCards
          ));
        });
      } else {
        final errorData = jsonDecode(response.body);
        setState(() {
          _messages.add(ChatMessage(
            sender: Sender.llm,
            text: 'Bir hata oluştu: ${errorData['detail']}',
          ));
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          sender: Sender.llm,
          text: 'Bağlantı hatası: $e',
        ));
      });
    } finally {
      setState(() {
        _isLoading = false;
    });
      _scrollToBottom();
    }
  }

  void _onRetrySearch() {
    setState(() {
      _showRetrySearchBar = true;
    });
  }

  Future<void> _searchSimilarProducts(Product product) async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Prepare product data for tag generation
      final productData = {
        'urun_adi': product.name,
        'urun_aciklama': product.description,
        'urun_adi_en': product.name,
        'visual_representation': product.description,
      };

      final response = await http.post(
        Uri.parse('http://localhost:8000/similar_products'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'product': productData}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success'] == true) {
          final List<dynamic> productList = data['products'];
          final int numberOfCards = data['number_of_cards'] ?? 4;
          final products = productList.map((p) => Product.fromJson(p)).toList();
          
          setState(() {
            // Add text message for similar products
            _messages.add(ChatMessage(
              sender: Sender.llm,
              text: 'Seçiminizle en çok uyuşan ürünleri getirdim:',
            ));
            // Add the similar products
            _messages.add(ChatMessage(
              sender: Sender.llm, 
              products: products, 
              numberOfCards: numberOfCards
            ));
          });
        } else {
          setState(() {
            _messages.add(ChatMessage(
              sender: Sender.llm,
              text: 'Database\'de benzer ürün bulunamadı: ${data['message'] ?? 'Bilinmeyen hata'}',
            ));
          });
        }
      } else {
        final errorData = jsonDecode(response.body);
        setState(() {
          _messages.add(ChatMessage(
            sender: Sender.llm,
            text: 'Benzer ürünler getirilirken hata oluştu: ${errorData['detail']}',
          ));
        });
      }
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          sender: Sender.llm,
          text: 'Benzer ürünler getirilemedi: $e',
        ));
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  void _hideRetrySearchBar() {
    setState(() {
      _showRetrySearchBar = false;
    });
  }

  // Check if any products have been loaded in the conversation
  bool _hasProductsLoaded() {
    return _messages.any((message) => 
      message.sender == Sender.llm && 
      message.products != null && 
      message.products!.isNotEmpty
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16.0),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                if (message.sender == Sender.user) {
                  return _buildUserMessage(message);
                } else {
                  return _buildSystemMessage(message);
                }
              },
            ),
          ),
          
          // Loading indicator
          if (_isLoading)
            Container(
              padding: const EdgeInsets.all(16),
              child: const CircularProgressIndicator(color: Colors.orange),
            ),
          
          // Retry button when not showing searchbar and not loading and products are loaded
          if (_messages.isNotEmpty && !_showRetrySearchBar && !_isLoading && _hasProductsLoaded())
            Container(
              padding: const EdgeInsets.all(16),
              child: TextButton(
                onPressed: _onRetrySearch,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: Colors.grey[400]!),
                  ),
                ),
                child: const Text(
                  'Hiçbiri değil, tekrar tarif edeyim',
                  style: TextStyle(
                    color: Colors.black54,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          
          // Conditional search bar at bottom
          if (_showRetrySearchBar)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Tekrar tarif edin...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                      ),
                      onSubmitted: (value) {
                        if (value.isNotEmpty) {
                          _sendMessage();
                          _hideRetrySearchBar();
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      if (_controller.text.isNotEmpty) {
                        _sendMessage();
                        _hideRetrySearchBar();
                      }
                    },
                    icon: const Icon(Icons.send, color: Colors.orange),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.orange[50],
                      shape: const CircleBorder(),
                    ),
                  ),
                  IconButton(
                    onPressed: _hideRetrySearchBar,
                    icon: const Icon(Icons.close, color: Colors.grey),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // Build user message bubble (right aligned)
  Widget _buildUserMessage(ChatMessage message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16, left: 50),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange[100],
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(4),
                ),
              ),
              child: Text(
                message.text ?? '',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Build system message bubble (left aligned)
  Widget _buildSystemMessage(ChatMessage message) {
    // If message has products, show them in grid format
    if (message.products != null && message.products!.isNotEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16, right: 50),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(4),
                    bottomRight: Radius.circular(20),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Products grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.0,
                      ),
                      itemCount: message.products!.length,
                      itemBuilder: (context, index) {
                        final product = message.products![index];
                        return _buildGridProductCard(product);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    } else {
      // If message has only text, show as simple text bubble
      return Container(
        margin: const EdgeInsets.only(bottom: 16, right: 50),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(4),
                    bottomRight: Radius.circular(20),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  message.text ?? 'Sanırım ne demek istediğinizi anladım. Aklınızdaki \'o şey\' bunlardan biri olabilir mi?',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.black87,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }
  }

  // Build individual product card with its own button
  Widget _buildProductCard(Product product) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product image
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image(
                    image: product.image,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[100],
                        child: Icon(
                          Icons.image,
                          color: Colors.grey[400],
                          size: 30,
                        ),
                      );
                    },
                  ),
                ),
              ),
              
              const SizedBox(width: 12),
              
              // Product details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[800],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      product.description,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Individual "Benzer Ürünleri Getir" button for each product
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                _searchSimilarProducts(product);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Benzer Ürünleri Getir',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Build grid product card (for 3-column layout)
  Widget _buildGridProductCard(Product product) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product image
          // Image placeholder
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(4),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  color: Colors.grey[100],
                  child: Image(
                    image: product.image,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[100],
                        child: Icon(
                          Icons.image,
                          color: Colors.grey[400],
                          size: 30,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          
          // Product details
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(4.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    product.name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Expanded(
                    child: Text(
                      product.description,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Extra info or button
          Padding(
            padding: const EdgeInsets.all(4.0),
            child: () {
              // Eğer similarityScore varsa (DB'den gelen ürün) => info göster
              if (product.similarityScore != null) {
                final similarityPercent = (product.similarityScore! * 100).toStringAsFixed(1);
                return Column(
                  children: [
                    Text(
                      '%$similarityPercent benzer',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                    if (product.rating != null)
                      Text('⭐ ${product.rating!.toStringAsFixed(1)}  (${product.reviewCount ?? 0})',
                          style: const TextStyle(fontSize: 10)),
                    if (product.subcategory != null && product.subcategory!.isNotEmpty)
                      Text(product.subcategory!, style: const TextStyle(fontSize: 10)),
                  ],
                );
              } else {
                // Aksi halde (LLM üretimi) buton göster
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      _searchSimilarProducts(product);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                      elevation: 0,
                      minimumSize: const Size(0, 28),
                    ),
                    child: const Text(
                      'Benzer Ürünleri Getir',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              }
            }(),
          ),
        ],
      ),
    );
  }
}

// --- MESSAGE BUBBLE WIDGETS ---

class _UserMessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _UserMessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4.0),
        padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 16.0),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary,
          borderRadius: BorderRadius.circular(20.0),
        ),
        child: Text(
          message.text ?? '',
          style: TextStyle(color: Theme.of(context).colorScheme.onPrimary),
        ),
      ),
    );
  }
}

class _LlmResponseBubble extends StatelessWidget {
  final ChatMessage message;
  final Function(TagGenerationResult)? onTagResultGenerated;
  final Function(List<EcommerceProduct>)? onSearchResultsFound;
  
  const _LlmResponseBubble({
    required this.message, 
    this.onTagResultGenerated,
    this.onSearchResultsFound,
  });

  void _onProductTap(BuildContext context, Product product) async {
    print('Product tapped: ${product.name}');
    
    try {
      // Loading mesajı ekle
      if (onTagResultGenerated != null) {
        onTagResultGenerated!(TagGenerationResult(
          tags: [],
          confidence: 0.0,
          category: 'Loading...',
          reasoning: '${product.name} için tag\'ler üretiliyor...',
          visualDescription: '',
        ));
      }

      // Visual description ile tag generation endpoint'ini kullan
      final response = await http.post(
        Uri.parse('http://localhost:8000/generate_tags_with_visual'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'product': {
            'urun_adi': product.name,
            'urun_aciklama': product.description,
            'urun_adi_en': product.name, // Basit olarak aynı ismi kullan
            'image_base64': product.imageBase64,
          },
          'visual_description': product.visualRepresentation ?? 'No visual description available'
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final tags = List<String>.from(data['tags'] ?? []);
        final confidence = (data['confidence'] ?? 0.0).toDouble();
        final category = data['category'] ?? 'Unknown';
        final reasoning = data['reasoning'] ?? 'No reasoning provided';
        final visualDescription = data['visual_description_used'] ?? '';
        final searchResults = data['search_results'] as List<dynamic>? ?? [];
        
        print('Generated tags: $tags');
        print('Confidence: $confidence');
        print('Category: $category');
        print('Search results: ${searchResults.length} products found');
        
        // Tag sonuçlarını chat'e ekle
        if (onTagResultGenerated != null) {
          onTagResultGenerated!(TagGenerationResult(
            tags: tags,
            confidence: confidence,
            category: category,
            reasoning: reasoning,
            visualDescription: visualDescription,
          ));
        }
        
        // Backend'den gelen search results'ı kullan (similarity score'ları dahil)
        if (searchResults.isNotEmpty && onSearchResultsFound != null) {
          final ecommerceProducts = searchResults
              .map((product) => EcommerceProduct.fromJson(product))
              .toList();
          
          // Debug: Similarity score'ları log'la
          print('🔍 Products with similarity scores:');
          for (int i = 0; i < ecommerceProducts.length; i++) {
            final product = ecommerceProducts[i];
            final score = product.similarityScore ?? 0.0;
            print('  ${i+1}. ${product.name}: $score');
          }
          
          onSearchResultsFound!(ecommerceProducts);
        }
        
      } else {
        print('Tag generation failed: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tag generation failed'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      print('Error generating tags: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 4.0),
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20.0),
        ),
        child: _buildContent(context),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    // Tag generation sonuçları varsa onları göster
    if (message.tagResult != null) {
      final tagResult = message.tagResult!;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.auto_awesome,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Generated Tags',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (tagResult.tags.isNotEmpty) ...[
            Text(
              'Category: ${tagResult.category}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text('Confidence: ${(tagResult.confidence * 100).toStringAsFixed(1)}%'),
            const SizedBox(height: 8),
            const Text('Tags:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: tagResult.tags.map((tag) => Chip(
                label: Text(tag, style: const TextStyle(fontSize: 12)),
                backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSecondaryContainer),
              )).toList(),
            ),
            const SizedBox(height: 8),
            Text(
              tagResult.reasoning,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontStyle: FontStyle.italic,
              ),
            ),
          ] else ...[
            const CircularProgressIndicator(),
            const SizedBox(width: 8),
            Text(tagResult.reasoning),
          ],
        ],
      );
    }
    
    // E-ticaret arama sonuçları varsa onları göster
    if (message.searchResults != null && message.searchResults!.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.shopping_cart,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Benzer Ürünler (${message.searchResults!.length})',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 280,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: message.searchResults!.map((product) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: Card(
                      elevation: 2,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Image(image: product.image, fit: BoxFit.contain),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      product.name,
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${product.price} ${product.currency}',
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.primary,
                                      ),
                                    ),
                                    if (product.rating != null) ...[
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          const Icon(Icons.star, size: 12, color: Colors.amber),
                                          const SizedBox(width: 2),
                                          Text(
                                            '${product.rating}',
                                            style: const TextStyle(fontSize: 10),
                                          ),
                                          if (product.reviewCount != null)
                                            Text(
                                              ' (${product.reviewCount})',
                                              style: const TextStyle(fontSize: 10),
                                            ),
                                        ],
                                      ),
                                    ],
                                    if (product.similarityScore != null) ...[
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          const Icon(Icons.insights, size: 12, color: Colors.green),
                                          const SizedBox(width: 2),
                                          Text(
                                            'Uyuşma: ${(product.similarityScore! * 100).toStringAsFixed(0)}%',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: Colors.green.shade700,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                    const Spacer(),
                                    Text(
                                      product.category,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Theme.of(context).colorScheme.secondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      );
    }
    
    // Normal ürün önerileri varsa onları göster
    if (message.products != null && message.products!.isNotEmpty) {
      return SizedBox(
        height: 300,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: message.products!.map((product) {
            // Calculate card spacing based on number of cards
            final numberOfCards = message.numberOfCards ?? 4;
            final horizontalPadding = numberOfCards == 2 ? 12.0 : 
                                       numberOfCards == 3 ? 8.0 : 4.0;
            
            return Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
                child: Tooltip(
                  message: product.visualRepresentation ?? 'Visual description not available',
                  preferBelow: false,
                  showDuration: const Duration(seconds: 3),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  textStyle: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                  child: Material(
                    borderRadius: BorderRadius.circular(12),
                    elevation: 2,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _onProductTap(context, product),
                      hoverColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                      splashColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Image(image: product.image, fit: BoxFit.contain),
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      product.name,
                                      textAlign: TextAlign.center,
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.primary,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Expanded(
                                      child: SingleChildScrollView(
                                        child: Text(
                                          product.description,
                                          textAlign: TextAlign.center,
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.touch_app,
                                          size: 12,
                                          color: Theme.of(context).colorScheme.primary.withOpacity(0.6),
                                        ),
                                        const SizedBox(width: 4),
                                        Icon(
                                          Icons.info_outline,
                                          size: 12,
                                          color: Theme.of(context).colorScheme.secondary.withOpacity(0.6),
                                        ),
                                        const SizedBox(width: 2),
                                        Text(
                                          'Hover',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Theme.of(context).colorScheme.secondary.withOpacity(0.6),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      );
    }
    
    // Sadece text mesajı varsa
    return Text(message.text ?? 'Boş yanıt.');
  }
}

class _TextInputArea extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSendMessage;

  const _TextInputArea({required this.controller, required this.onSendMessage});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Hayalindeki ürünü tarif et...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(24.0)),
                ),
              ),
              onSubmitted: (_) => onSendMessage(),
            ),
          ),
          const SizedBox(width: 8.0),
          IconButton.filled(
            icon: const Icon(Icons.send),
            onPressed: onSendMessage,
            tooltip: 'Gönder',
          ),
        ],
      ),
    );
  }
}

// --- B2B BUSINESS PANEL SCREENS ---

// EKRAN 1: Business Panel - Tüm Ürünler
class BusinessPanel extends StatefulWidget {
  const BusinessPanel({super.key});

  @override
  State<BusinessPanel> createState() => _BusinessPanelState();
}

class _BusinessPanelState extends State<BusinessPanel> {
  final ABTestManager _testManager = ABTestManager();
  
  final List<BusinessProduct> products = [
    BusinessProduct(
      id: '1',
      name: 'Premium Bluetooth Kulaklık',
      description: 'Aktif gürültü önleme özellikli premium bluetooth kulaklık',
      rating: 4.7,
      reviewCount: 345,
      salesCount: 1250,
    ),
    BusinessProduct(
      id: '2', 
      name: 'Sport Bluetooth Kulaklık',
      description: 'Ter ve su dirençli spor bluetooth kulaklık',
      rating: 4.6,
      reviewCount: 289,
      salesCount: 850,
    ),
    BusinessProduct(
      id: '3',
      name: 'Gaming Kulaklık',
      description: 'Profesyonel oyuncular için tasarlanmış kablolu gaming kulaklık',
      rating: 4.8,
      reviewCount: 456,
      salesCount: 650,
    ),
  ];

  // A/B Test state management - Now using global manager
  // final Map<String, ABTestInfo> activeTests = {}; // Removed local state

  final List<Sale> recentSales = [
    Sale(productName: 'Premium Bluetooth Kulaklık', amount: 899.90, date: DateTime.now().subtract(const Duration(hours: 2))),
    Sale(productName: 'Sport Bluetooth Kulaklık', amount: 449.90, date: DateTime.now().subtract(const Duration(hours: 5))),
    Sale(productName: 'Gaming Kulaklık', amount: 699.90, date: DateTime.now().subtract(const Duration(hours: 8))),
  ];

  final List<Review> recentReviews = [
    Review(productName: 'Premium Bluetooth Kulaklık', rating: 5, comment: 'Harika ses kalitesi!', date: DateTime.now().subtract(const Duration(hours: 1))),
    Review(productName: 'Sport Bluetooth Kulaklık', rating: 4, comment: 'Spor için ideal', date: DateTime.now().subtract(const Duration(hours: 3))),
    Review(productName: 'Gaming Kulaklık', rating: 5, comment: 'Oyun deneyimi mükemmel', date: DateTime.now().subtract(const Duration(hours: 6))),
  ];

  @override
  void initState() {
    super.initState();
    _testManager.addListener(_onTestStateChanged);
    _testManager.loadActiveTests(); // Load persisted tests from database
  }

  @override
  void dispose() {
    _testManager.removeListener(_onTestStateChanged);
    super.dispose();
  }

  void _onTestStateChanged() {
    setState(() {
      // Rebuild when test state changes
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Satıcı Paneli'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pushReplacementNamed(context, '/'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: () => Navigator.pushReplacementNamed(context, '/'),
            tooltip: 'Alıcı Moduna Geç',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Sol blok - Ürün listesi
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ürünlerim',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.builder(
                      itemCount: products.length,
                      itemBuilder: (context, index) {
                        final product = products[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  product.description,
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.star, size: 16, color: Colors.amber),
                                    const SizedBox(width: 4),
                                    Text('${product.rating} (${product.reviewCount} yorum)'),
                                    const Spacer(),
                                    Text('${product.salesCount} satış'),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: _buildTestButton(context, product),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            // Sağ blok - İstatistikler
            Expanded(
              flex: 1,
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Son Satışlar
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.trending_up, color: Colors.green),
                                const SizedBox(width: 8),
                                Text(
                                  'Son Satışlar',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ...recentSales.take(3).map((sale) => Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          sale.productName,
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          '${sale.amount} TL',
                                          style: TextStyle(fontSize: 11, color: Colors.green.shade700),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    _formatTime(sale.date),
                                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                            )),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Son Yorumlar
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.comment, color: Colors.blue),
                                const SizedBox(width: 8),
                                Text(
                                  'Son Yorumlar',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ...recentReviews.take(2).map((review) => Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          review.productName,
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Row(
                                        children: List.generate(5, (i) => Icon(
                                          Icons.star,
                                          size: 12,
                                          color: i < review.rating ? Colors.amber : Colors.grey.shade300,
                                        )),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    review.comment,
                                    style: const TextStyle(fontSize: 11),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatTime(review.date),
                                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                            )),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTestButton(BuildContext context, BusinessProduct product) {
    final testInfo = _testManager.getActiveTest(product.id);
    
    if (testInfo == null) {
      // State 1: No test running - Show "A/B Test Başlat"
      return ElevatedButton.icon(
        onPressed: () => _startABTest(context, product),
        icon: const Icon(Icons.science),
        label: const Text('A/B Test Başlat'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
        ),
      );
    } else {
      // State 2: Test is running - Show status and "Sonuçları Gör"
      return Column(
        children: [
          // Test status indicator
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.orange.shade100,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.shade300),
            ),
            child: Row(
              children: [
                Icon(Icons.science, size: 16, color: Colors.orange.shade700),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'A/B Test Sürüyor (${testInfo.testField == 'title' ? 'Başlık' : 'Açıklama'})',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.orange.shade700,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade200,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _getTestDuration(testInfo.startDate),
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.orange.shade800,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // View results button
          ElevatedButton.icon(
            onPressed: () => _viewTestResults(context, product, testInfo),
            icon: const Icon(Icons.analytics),
            label: const Text('Sonuçları Gör'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      );
    }
  }

  void _startABTest(BuildContext context, BusinessProduct product) {
    Navigator.pushNamed(
      context,
      '/ab-test-setup',
      arguments: product,
    );
  }

  void _viewTestResults(BuildContext context, BusinessProduct product, ABTestInfo testInfo) {
    Navigator.pushNamed(
      context,
      '/ab-test-results',
      arguments: {
        'product': product,
        'testField': testInfo.testField,
        'aVariant': testInfo.aVariant,
        'bVariant': testInfo.bVariant,
      },
    );
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inHours < 1) {
      return '${difference.inMinutes}dk önce';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}sa önce';
    } else {
      return '${difference.inDays}g önce';
    }
  }

  String _getTestDuration(DateTime startDate) {
    final now = DateTime.now();
    final difference = now.difference(startDate);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}g';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}sa';
    } else {
      return '${difference.inMinutes}dk';
    }
  }
}

// Data Models for B2B
class BusinessProduct {
  final String id;
  final String name;
  final String description;
  final double rating;
  final int reviewCount;
  final int salesCount;

  BusinessProduct({
    required this.id,
    required this.name,
    required this.description,
    required this.rating,
    required this.reviewCount,
    required this.salesCount,
  });
}

class ABTestInfo {
  final String testField; // 'title' or 'description'
  final String aVariant;
  final String bVariant;
  final DateTime startDate;

  ABTestInfo({
    required this.testField,
    required this.aVariant,
    required this.bVariant,
    required this.startDate,
  });

  factory ABTestInfo.fromJson(Map<String, dynamic> json) {
    return ABTestInfo(
      testField: json['test_field'] ?? 'title',
      aVariant: json['a_variant'] ?? '',
      bVariant: json['b_variant'] ?? '',
      startDate: DateTime.parse(json['start_date'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class Sale {
  final String productName;
  final double amount;
  final DateTime date;

  Sale({
    required this.productName,
    required this.amount,
    required this.date,
  });
}

class Review {
  final String productName;
  final int rating;
  final String comment;
  final DateTime date;

  Review({
    required this.productName,
    required this.rating,
    required this.comment,
    required this.date,
  });
}

// EKRAN 2: A/B Test Setup Screen
class ABTestSetupScreen extends StatefulWidget {
  final BusinessProduct? product;

  const ABTestSetupScreen({super.key, this.product});

  @override
  State<ABTestSetupScreen> createState() => _ABTestSetupScreenState();
}

class _ABTestSetupScreenState extends State<ABTestSetupScreen> {
  String selectedField = 'title'; // 'title' or 'description'
  late TextEditingController aGroupController;
  late TextEditingController bGroupController;
  late BusinessProduct product;
  final ABTestManager _testManager = ABTestManager();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Get product from route arguments
    product = widget.product ?? ModalRoute.of(context)!.settings.arguments as BusinessProduct;
  }

  @override
  void initState() {
    super.initState();
    aGroupController = TextEditingController();
    bGroupController = TextEditingController();
    // Initialize after we have the product
    WidgetsBinding.instance.addPostFrameCallback((_) {
      aGroupController.text = product.name;
      bGroupController.text = _generateBVariant();
    });
  }

  @override
  void dispose() {
    aGroupController.dispose();
    bGroupController.dispose();
    super.dispose();
  }

  String _generateBVariant() {
    // Simulate LLM-generated B variant
    if (selectedField == 'title') {
      return '${product.name} - Yeni Nesil';
    } else {
      return '${product.description}\n\nÜstün teknoloji ile geliştirilmiş, kullanıcı deneyimini maksimize eden özellikler.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('A/B Test Başlat'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ürün bilgisi
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.headphones, size: 30),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.star, size: 16, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text('${product.rating} (${product.reviewCount} yorum)'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Test alanı seçimi
            Text(
              'Hangi alanda A/B testing başlatmak istersiniz?',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            RadioListTile<String>(
              title: const Text('Ürün Başlığı'),
              value: 'title',
              groupValue: selectedField,
              onChanged: (value) {
                setState(() {
                  selectedField = value!;
                  aGroupController.text = product.name;
                  bGroupController.text = _generateBVariant();
                });
              },
            ),
            RadioListTile<String>(
              title: const Text('Ürün Açıklaması'),
              value: 'description',
              groupValue: selectedField,
              onChanged: (value) {
                setState(() {
                  selectedField = value!;
                  aGroupController.text = product.description;
                  bGroupController.text = _generateBVariant();
                });
              },
            ),
            
            const SizedBox(height: 24),
            
            // A/B karşılaştırma bölümü
            Expanded(
              child: Row(
                children: [
                  // A Grubu (Kontrol)
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: const BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Center(
                                    child: Text('A', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text('Kontrol Grubu', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text('Mevcut ${selectedField == 'title' ? 'başlık' : 'açıklama'}:'),
                            const SizedBox(height: 8),
                            Expanded(
                              child: TextField(
                                controller: aGroupController,
                                readOnly: true,
                                maxLines: null,
                                expands: true,
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(),
                                  filled: true,
                                  fillColor: Colors.grey.shade100,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // B Grubu (Agent önerisi)
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: const BoxDecoration(
                                    color: Colors.green,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Center(
                                    child: Text('B', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text('LLM Önerisi', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text('Agent önerisi (düzenlenebilir):'),
                            const SizedBox(height: 8),
                            Expanded(
                              child: TextField(
                                controller: bGroupController,
                                maxLines: null,
                                expands: true,
                                decoration: const InputDecoration(
                                  border: OutlineInputBorder(),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Testi başlat butonu
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _startTest(context),
                icon: const Icon(Icons.rocket_launch),
                label: const Text('Testi Başlat'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _startTest(BuildContext context) async {
    // Test bilgilerini oluştur
    final testInfo = ABTestInfo(
      testField: selectedField,
      aVariant: aGroupController.text,
      bVariant: bGroupController.text,
      startDate: DateTime.now(),
    );

    // Global state manager'a test ekle (database'e de kaydeder)
    await _testManager.startTest(product.id, testInfo);

    // Results sayfasına named route ile git
    Navigator.pushNamed(
      context,
      '/ab-test-results',
      arguments: {
        'product': product,
        'testField': selectedField,
        'aVariant': aGroupController.text,
        'bVariant': bGroupController.text,
      },
    );
  }
}

// EKRAN 3: A/B Test Results Screen
class ABTestResultsScreen extends StatefulWidget {
  final BusinessProduct product;
  final String testField;
  final String aVariant;
  final String bVariant;

  const ABTestResultsScreen({
    super.key,
    required this.product,
    required this.testField,
    required this.aVariant,
    required this.bVariant,
  });

  @override
  State<ABTestResultsScreen> createState() => _ABTestResultsScreenState();
}

class _ABTestResultsScreenState extends State<ABTestResultsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('A/B Test Sonuçları'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ürün bilgisi
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.headphones, size: 30),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.product.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text('Test Alanı: ${widget.testField == 'title' ? 'Ürün Başlığı' : 'Ürün Açıklaması'}'),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Test Aktif',
                              style: TextStyle(color: Colors.green.shade700, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Canlı sonuçlar
            Text(
              'Canlı Test Sonuçları',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            Expanded(
              child: Row(
                children: [
                  // A Grubu sonuçları
                  Expanded(
                    child: _buildTestResults(
                      'A',
                      Colors.blue,
                      'Kontrol Grubu',
                      widget.aVariant,
                      1250, // görüntülenme
                      67,   // tıklama
                      12,   // satın alma
                    ),
                  ),
                  const SizedBox(width: 16),
                  // B Grubu sonuçları
                  Expanded(
                    child: _buildTestResults(
                      'B',
                      Colors.green,
                      'LLM Varyasyonu',
                      widget.bVariant,
                      1180, // görüntülenme
                      89,   // tıklama
                      18,   // satın alma
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Agent yorumları
            Card(
              color: Colors.purple.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.psychology, color: Colors.purple),
                        const SizedBox(width: 8),
                        Text(
                          'Agent Analizi',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.purple.shade700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('🎯 B varyasyonu A\'ya göre %33 daha iyi performans gösteriyor.'),
                    const SizedBox(height: 8),
                    const Text('📈 Tıklama oranı %7.5\'e çıktı (A grubunda %5.4).'),
                    const SizedBox(height: 8),
                    const Text('💰 Dönüşüm oranı %1.5\'e yükseldi (A grubunda %1.0).'),
                    const SizedBox(height: 8),
                    const Text('🚀 Önerilen eylem: B varyasyonunu tüm kullanıcılara yaygınlaştır.'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTestResults(String group, Color color, String title, String content, int views, int clicks, int purchases) {
    final clickRate = (clicks / views * 100);
    final conversionRate = (purchases / clicks * 100);
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(group, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            
            // Metin içeriği
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                content,
                style: const TextStyle(fontSize: 12),
                maxLines: widget.testField == 'title' ? 2 : 4,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Metrikler
            _buildMetric('👀 Görüntülenme', views.toString()),
            const SizedBox(height: 8),
            _buildMetric('👆 Tıklama', '$clicks (${clickRate.toStringAsFixed(1)}%)'),
            const SizedBox(height: 8),
            _buildMetric('🛒 Satın Alma', '$purchases (${conversionRate.toStringAsFixed(1)}%)'),
            
            const SizedBox(height: 16),
            
            // Performans göstergesi
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: group == 'B' ? Colors.green.shade100 : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                group == 'B' ? '🚀 Daha iyi performans' : '📊 Baseline',
                style: TextStyle(
                  color: group == 'B' ? Colors.green.shade700 : Colors.grey.shade700,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}

// --- GLOBAL STATE MANAGEMENT ---

class ABTestManager {
  static final ABTestManager _instance = ABTestManager._internal();
  factory ABTestManager() => _instance;
  ABTestManager._internal();

  final Map<String, ABTestInfo> _activeTests = {};
  final List<Function()> _listeners = [];

  Map<String, ABTestInfo> get activeTests => Map.unmodifiable(_activeTests);

  void addListener(Function() listener) {
    _listeners.add(listener);
  }

  void removeListener(Function() listener) {
    _listeners.remove(listener);
  }

  void _notifyListeners() {
    for (final listener in _listeners) {
      listener();
    }
  }

  Future<void> startTest(String productId, ABTestInfo testInfo) async {
    _activeTests[productId] = testInfo;
    await _saveToDatabase(productId, testInfo);
    _notifyListeners();
  }

  Future<void> loadActiveTests() async {
    // Load from backend/database
    try {
      final response = await http.get(Uri.parse('http://localhost:8000/ab-tests/active'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _activeTests.clear();
        data.forEach((productId, testData) {
          _activeTests[productId] = ABTestInfo.fromJson(testData);
        });
        _notifyListeners();
      }
    } catch (e) {
      print('Error loading active tests: $e');
      // Fallback: Use local storage or mock data
      _loadMockData();
    }
  }

  void _loadMockData() {
    // For demo purposes, add some mock active tests
    // This would be replaced with actual database loading
  }

  Future<void> _saveToDatabase(String productId, ABTestInfo testInfo) async {
    try {
      await http.post(
        Uri.parse('http://localhost:8000/ab-tests/start'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'product_id': productId,
          'test_field': testInfo.testField,
          'a_variant': testInfo.aVariant,
          'b_variant': testInfo.bVariant,
          'start_date': testInfo.startDate.toIso8601String(),
        }),
      );
    } catch (e) {
      print('Error saving test to database: $e');
    }
  }

  bool hasActiveTest(String productId) {
    return _activeTests.containsKey(productId);
  }

  ABTestInfo? getActiveTest(String productId) {
    return _activeTests[productId];
  }
}

// --- WELCOME SCREEN ---

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  void _navigateToChat({String? initialMessage}) {
    Navigator.pushNamed(
      context, 
      '/chat',
      arguments: initialMessage,
    );
  }

  void _searchWithExample(String exampleText) {
    setState(() {
      _searchController.text = exampleText;
    });
    _navigateToChat(initialMessage: exampleText);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Icon(
            Icons.person_outline,
            color: Colors.orange,
            size: 28,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/business'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[400]!),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.business, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      'Satıcı Girişi',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo area
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(60),
                child: Image.asset(
                  'assets/logo.jpeg',
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback widget if logo fails to load
                    return Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.orange[100],
                        borderRadius: BorderRadius.circular(60),
                      ),
                      child: Icon(
                        Icons.image,
                        size: 60,
                        color: Colors.orange,
                      ),
                    );
                  },
                ),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Main title
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                  height: 1.2,
                ),
                children: [
                  const TextSpan(text: 'Aklındaki '),
                  TextSpan(
                    text: 'o şeyi',
                    style: TextStyle(
                      color: Colors.orange[600],
                    ),
                  ),
                  const TextSpan(text: ' tarif et.'),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Subtitle
            Text(
              'Adı dilinin ucunda, kendisi bir tık uzağında.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 48),
            
            // Search input
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'parti içecek şapkası... fayans arasına sürülen şey... kafamın üstüne oturan ipsiz kulaklık...',
                  hintStyle: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 14,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  suffixIcon: Container(
                    margin: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_forward, color: Colors.black54),
                      onPressed: () {
                        if (_searchController.text.isNotEmpty) {
                          _navigateToChat(initialMessage: _searchController.text);
                        }
                      },
                    ),
                  ),
                ),
                onSubmitted: (value) {
                  if (value.isNotEmpty) {
                    _navigateToChat(initialMessage: value);
                  }
                },
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Example buttons
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                _buildExampleButton('alet çantasındaki ucu yıldız gibi olan alet'),
                _buildExampleButton('fayans arasına sürülen şey'),
                _buildExampleButton('elimde tutabileceğim vantilatör'),
              ],
            ),
            
            const SizedBox(height: 60),
            
            // Footer
            Text(
              '© 2025 Sezgi',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExampleButton(String text) {
    return GestureDetector(
      onTap: () => _searchWithExample(text),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

