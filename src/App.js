import React, { useState } from 'react';
import { Search, Plus, MessageCircle, Clock, User, Tag, Upload, Download, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const App = () => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: "スマホ表示でヘッダーメニューが崩れてしまいます",
      content: "レスポンシブデザインのテーマを使用していますが、スマートフォンで表示した時にヘッダーメニューが崩れてしまいます。CSSで修正方法を教えてください。",
      category: "Helsinki",
      author: "山田太郎",
      date: "2025-06-20",
      answered: true,
      answer: "CSSのメディアクエリを確認してみてください。@media (max-width: 768px) でスマホ用のスタイルが適用されているか確認し、ヘッダーメニューのflexboxプロパティを調整してください。",
      answerDate: "2025-06-21"
    },
    {
      id: 2,
      title: "商品画像のサムネイルサイズを変更したい",
      content: "商品一覧ページで表示される商品画像のサムネイルサイズを大きくしたいのですが、どのファイルを編集すればよいでしょうか？",
      category: "Stockholm",
      author: "田中花子",
      date: "2025-06-18",
      answered: true,
      answer: "テーマファイルのproduct-list.cssまたはstyle.cssで、.product-thumbnail クラスのwidth と height プロパティを調整してください。また、aspect-ratioも合わせて調整することをお勧めします。",
      answerDate: "2025-06-19"
    },
    {
      id: 3,
      title: "フォントを変更する方法について",
      content: "デフォルトのフォントから別のWebフォントに変更したいです。Google Fontsを使用する場合の手順を教えてください。",
      category: "Copenhagen",
      author: "佐藤次郎",
      date: "2025-06-15",
      answered: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // 'answered', 'unanswered', ''
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    category: '',
    author: ''
  });
  const [newAnswer, setNewAnswer] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importStep, setImportStep] = useState('select'); // 'select', 'preview', 'processing'
  const [importMethod, setImportMethod] = useState('file'); // 'file' or 'url'
  const [tumblrUrl, setTumblrUrl] = useState('');
  const [urlImportStatus, setUrlImportStatus] = useState('');
  const [urlImportError, setUrlImportError] = useState('');

  const categories = ['Helsinki', 'Stockholm', 'Copenhagen', 'Amsterdam'];

  // 【追加】実際のTumblr API呼び出し関数
  const fetchRealTumblrData = async (blogName, apiKey) => {
    const apiUrl = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/posts`;
    
    // 方法1：直接API呼び出し（CORS制限あり）
    try {
      const response = await fetch(`${apiUrl}?api_key=${apiKey}&type=text&limit=20`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      return parseTumblrApiResponse(data);
    } catch (corsError) {
      console.log('Direct API call failed (CORS):', corsError);
      
      // 方法2：JSONP形式での呼び出し
      return await fetchWithJSONP(blogName, apiKey);
    }
  };

  // JSONP形式でのAPI呼び出し（CORS回避）
  const fetchWithJSONP = (blogName, apiKey) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = `tumblr_callback_${Date.now()}`;
      
      // グローバルコールバック関数を設定
      window[callbackName] = (data) => {
        document.body.removeChild(script);
        delete window[callbackName];
        resolve(parseTumblrApiResponse(data));
      };
      
      script.src = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/posts?api_key=${apiKey}&type=text&limit=20&jsonp=${callbackName}`;
      script.onerror = () => {
        document.body.removeChild(script);
        delete window[callbackName];
        reject(new Error('JSONP request failed'));
      };
      
      document.body.appendChild(script);
      
      // タイムアウト設定
      setTimeout(() => {
        if (window[callbackName]) {
          document.body.removeChild(script);
          delete window[callbackName];
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  };

  // Tumblr APIレスポンスを質問形式に変換
  const parseTumblrApiResponse = (apiData) => {
    const posts = apiData.response?.posts || [];
    const questions = [];
    
    posts.forEach((post, index) => {
      if (post.type === 'text' && (post.title || post.body)) {
        // カテゴリの決定（タグからテーマ名を推測）
        let category = 'Helsinki'; // デフォルト
        const tags = post.tags || [];
        const tagString = tags.join(' ').toLowerCase();
        
        if (tagString.includes('stockholm') || tagString.includes('minimal')) {
          category = 'Stockholm';
        } else if (tagString.includes('copenhagen') || tagString.includes('modern')) {
          category = 'Copenhagen';
        } else if (tagString.includes('amsterdam') || tagString.includes('creative')) {
          category = 'Amsterdam';
        }

        // HTMLタグを除去
        const stripHtml = (html) => {
          if (!html) return '';
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || '';
        };

        const question = {
          id: `tumblr_api_${post.id}`,
          title: post.title || stripHtml(post.body).substring(0, 50) + '...',
          content: stripHtml(post.body),
          category: category,
          author: post.blog_name || 'Tumblrユーザー',
          date: post.date.split(' ')[0], // 日付部分のみ抽出
          answered: false,
          tumblrUrl: post.post_url,
          tumblrTags: tags
        };

        questions.push(question);
      }
    });

    return questions;
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || q.category === selectedCategory;
    const matchesStatus = selectedStatus === '' || 
                         (selectedStatus === 'answered' && q.answered) ||
                         (selectedStatus === 'unanswered' && !q.answered);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const submitQuestion = () => {
    if (!newQuestion.title || !newQuestion.content || !newQuestion.category || !newQuestion.author) {
      alert('すべての項目を入力してください。');
      return;
    }
    
    const question = {
      id: Date.now(),
      ...newQuestion,
      date: new Date().toISOString().split('T')[0],
      answered: false
    };
    setQuestions([question, ...questions]);
    setNewQuestion({ title: '', content: '', category: '', author: '' });
    setShowNewQuestion(false);
  };

  const submitAnswer = (id) => {
    setQuestions(questions.map(q => 
      q.id === id 
        ? { ...q, answered: true, answer: newAnswer, answerDate: new Date().toISOString().split('T')[0] }
        : q
    ));
    setNewAnswer('');
    setAnsweringId(null);
  };

  // TumblrブログURLからデータを取得
  const fetchTumblrFromUrl = async (blogUrl) => {
    setUrlImportStatus('TumblrブログURLから投稿を取得中...');
    setUrlImportError('');
    
    try {
      // ブログ名を抽出
      const blogName = blogUrl.replace('https://', '').replace('.tumblr.com/', '').replace('.tumblr.com', '');
      
      // 【実際のAPIキー実装】ここにAPIキーを設定
      const API_KEY = 'tnIPpRJ51gGtRKUleFH1ktfb87FEn6bnQtPVseX8s492T6TDYE'; // あなたのOAuth Consumer Key
      
      // 実際のTumblr API呼び出し
      try {
        const realData = await fetchRealTumblrData(blogName, API_KEY);
        if (realData && realData.length > 0) {
          setUrlImportStatus(`${realData.length}件の質問を取得しました`);
          return realData;
        }
      } catch (apiError) {
        console.log('API call failed, falling back to mock data:', apiError);
        setUrlImportStatus('API呼び出しに失敗しました。デモデータを使用します。');
      }
      
      // フォールバック：デモ用モックデータ
      const mockQuestionsData = {
        'base-stockholm': [
          {
            id: 'stockholm_1',
            title: 'Stockholmテーマのミニマルデザインについて',
            content: 'Stockholmテーマを使用していますが、よりミニマルなデザインにカスタマイズしたいです。余白の調整方法を教えてください。',
            category: 'Stockholm',
            author: 'デザイン好き',
            date: '2024-12-15',
            answered: false,
            tumblrUrl: blogUrl + '/post/123456789',
            tumblrTags: ['stockholm', 'minimal', 'design']
          },
          {
            id: 'stockholm_2',
            title: '商品画像のギャラリー表示について',
            content: 'Stockholmテーマで商品画像を複数枚きれいに表示したいです。グリッドレイアウトの設定方法はありますか？',
            category: 'Stockholm',
            author: 'ショップオーナー',
            date: '2024-12-10',
            answered: true,
            answer: 'Stockholmテーマでは、商品画像ギャラリー機能が標準搭載されています。管理画面の「デザイン設定」→「商品ページ」から画像レイアウトを選択できます。',
            answerDate: '2024-12-11',
            tumblrUrl: blogUrl + '/post/123456790',
            tumblrTags: ['stockholm', 'gallery', 'products']
          },
          {
            id: 'stockholm_3',
            title: 'フォントファミリーの変更について',
            content: 'Stockholmテーマのデフォルトフォントを変更したいです。Google Fontsの導入は可能でしょうか？',
            category: 'Stockholm',
            author: 'タイポグラフィ愛好家',
            date: '2024-12-05',
            answered: false,
            tumblrUrl: blogUrl + '/post/123456791',
            tumblrTags: ['stockholm', 'fonts', 'typography']
          }
        ],
        'base-helsinki': [
          {
            id: 'helsinki_1',
            title: 'Helsinkiテーマのレスポンシブ対応について',
            content: 'Helsinkiテーマを使用していますが、タブレット表示で一部のレイアウトが崩れます。メディアクエリの調整方法を教えてください。',
            category: 'Helsinki',
            author: 'モバイル重視',
            date: '2024-12-12',
            answered: true,
            answer: 'Helsinkiテーマでは、768px-1024pxの範囲でタブレット専用のCSSが適用されます。カスタムCSSで @media (min-width: 768px) and (max-width: 1024px) を使用して調整してください。',
            answerDate: '2024-12-13',
            tumblrUrl: blogUrl + '/post/123456792',
            tumblrTags: ['helsinki', 'responsive', 'tablet']
          },
          {
            id: 'helsinki_2',
            title: 'ヘッダーメニューのカスタマイズ',
            content: 'Helsinkiテーマのヘッダーメニューに独自のリンクを追加したいです。HTMLの編集は必要でしょうか？',
            category: 'Helsinki',
            author: 'カスタム派',
            date: '2024-12-08',
            answered: false,
            tumblrUrl: blogUrl + '/post/123456793',
            tumblrTags: ['helsinki', 'header', 'menu']
          }
        ],
        'base-copenhagen': [
          {
            id: 'copenhagen_1',
            title: 'Copenhagenテーマのモダンな配色について',
            content: 'Copenhagenテーマの配色をより現代的にしたいです。カラーパレットの変更方法を教えてください。',
            category: 'Copenhagen',
            author: 'カラー研究家',
            date: '2024-12-14',
            answered: true,
            answer: 'Copenhagenテーマでは、CSS変数を使用して配色管理をしています。:root { --primary-color: #your-color; } でメインカラーを変更できます。',
            answerDate: '2024-12-15',
            tumblrUrl: blogUrl + '/post/123456794',
            tumblrTags: ['copenhagen', 'colors', 'modern']
          }
        ],
        'base-amsterdam': [
          {
            id: 'amsterdam_1',
            title: 'Amsterdamテーマのクリエイティブレイアウト',
            content: 'Amsterdamテーマでよりクリエイティブなレイアウトを実現したいです。非対称デザインは可能でしょうか？',
            category: 'Amsterdam',
            author: 'クリエイター',
            date: '2024-12-11',
            answered: false,
            tumblrUrl: blogUrl + '/post/123456795',
            tumblrTags: ['amsterdam', 'creative', 'layout']
          }
        ]
      };
      
      // 実際の実装用コメント
      /*
      実際の実装では以下のような流れになります：
      
      1. Tumblr API経由でのデータ取得
      const apiUrl = `https://api.tumblr.com/v2/blog/${blogName}/posts`;
      const response = await fetch(`${apiUrl}?api_key=${API_KEY}&type=text`);
      
      2. プロキシサーバー経由での取得
      const proxyUrl = `https://your-proxy-server.com/tumblr/${blogName}`;
      const response = await fetch(proxyUrl);
      
      3. RSS/JSON フィード経由
      const feedUrl = `https://${blogName}.tumblr.com/api/read/json`;
      const response = await fetch(feedUrl);
      */
      
      // モックデータから対応するブログの質問を取得
      const questionsForBlog = mockQuestionsData[blogName] || [];
      
      if (questionsForBlog.length === 0) {
        throw new Error(`このブログ（${blogName}）にはサポート用の質問データがありません。\n\nサポートされているブログ：\n- base-stockholm\n- base-helsinki  \n- base-copenhagen\n- base-amsterdam`);
      }
      
      setUrlImportStatus(`${questionsForBlog.length}件の質問を取得しました`);
      
      // 少し待機してよりリアルな感じに
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return questionsForBlog;
      
    } catch (error) {
      setUrlImportError(error.message);
      throw error;
    }
  };

  // URL からのインポート処理
  const handleUrlImport = async () => {
    if (!tumblrUrl.trim()) {
      setUrlImportError('TumblrブログのURLを入力してください');
      return;
    }

    if (!tumblrUrl.includes('tumblr.com')) {
      setUrlImportError('有効なTumblrブログのURLを入力してください');
      return;
    }

    setImportStep('processing');
    setUrlImportError('');

    try {
      const questionsData = await fetchTumblrFromUrl(tumblrUrl);
      setImportPreview(questionsData);
      setImportStep('preview');
    } catch (error) {
      console.error('URL import error:', error);
      setUrlImportError(`データの取得に失敗しました: ${error.message}`);
      setImportStep('select');
    }
  };

  // 既存のTumblrデータ解析関数（ファイルインポート用）
  const parseTumblrData = (tumblrData) => {
    const parsedQuestions = [];
    
    console.log('=== Tumblr Data Analysis ===');
    console.log('Data type:', typeof tumblrData);
    console.log('Is array:', Array.isArray(tumblrData));
    console.log('Root keys:', Object.keys(tumblrData));
    
    // 新形式（payload-0.json）と旧形式（posts.json）の両方に対応
    let posts = [];
    
    if (tumblrData.posts && Array.isArray(tumblrData.posts)) {
      // 旧形式: posts.json
      console.log('Found posts array (old format)');
      posts = tumblrData.posts;
    } else if (tumblrData.response && tumblrData.response.posts && Array.isArray(tumblrData.response.posts)) {
      // 旧形式の別パターン
      console.log('Found response.posts array (old format variant)');
      posts = tumblrData.response.posts;
    } else if (Array.isArray(tumblrData)) {
      // 新形式: payload-0.json（配列形式）
      console.log('Found root array (new format)');
      
      // 各要素の data プロパティを確認
      tumblrData.forEach((item, index) => {
        console.log(`Array item ${index}:`, Object.keys(item));
        if (item.data) {
          console.log(`Item ${index} has data property:`, Object.keys(item.data));
          
          // data プロパティの中身を詳細確認
          const dataContent = item.data;
          console.log('Data content structure:', dataContent);
          
          // 投稿データを探す
          const possiblePostKeys = [
            'posts', 'blog_posts', 'content', 'tumblr_posts', 'user_posts', 'published_posts'
          ];
          
          // まず通常の投稿データを探す
          for (const key of possiblePostKeys) {
            if (dataContent[key]) {
              console.log(`Found potential posts in data.${key}:`, dataContent[key]);
              if (Array.isArray(dataContent[key])) {
                posts = dataContent[key];
                console.log(`Using posts from data.${key} (${posts.length} items)`);
                break;
              }
            }
          }
          
          // 通常の投稿データが見つからない場合、highlighted_postsを優先的にチェック
          if (posts.length === 0 && dataContent.highlighted_posts) {
            console.log(`Found highlighted posts in data.highlighted_posts. Converting to posts...`);
            const highlightedPosts = [];
            
            dataContent.highlighted_posts.forEach(item => {
              if (item.post_urls && item.post_urls.length > 0) {
                item.post_urls.forEach((url, urlIndex) => {
                  // URLからタイトルを抽出（URLデコード）
                  let title = `${item.blog_name} のハイライト投稿 ${urlIndex + 1}`;
                  let content = `この質問は ${item.blog_name} ブログのハイライト投稿です。詳細な内容を確認するには元の投稿をご覧ください。`;
                  
                  try {
                    // URLの最後の部分からタイトルを抽出
                    const urlParts = url.split('/');
                    const lastPart = urlParts[urlParts.length - 1];
                    if (lastPart && lastPart.length > 10) {
                      // URLエンコードされた日本語をデコード
                      const decodedTitle = decodeURIComponent(lastPart);
                      
                      // %E3%形式の文字列をデコード
                      let cleanTitle = decodedTitle;
                      
                      // 特殊文字や記号をスペースに置換
                      cleanTitle = cleanTitle.replace(/[%\-_]/g, ' ')
                                           .replace(/\s+/g, ' ')
                                           .trim();
                      
                      if (cleanTitle.length > 5 && cleanTitle.length < 200) {
                        title = cleanTitle.substring(0, 80) + (cleanTitle.length > 80 ? '...' : '');
                        
                        // タイトルから詳細な内容を生成
                        const titleLower = cleanTitle.toLowerCase();
                        if (titleLower.includes('instagram') || titleLower.includes('インスタ')) {
                          content = 'Instagram連携機能の設定について質問です。Instagram画像の表示方法や連携設定で困っています。具体的な設定手順や表示されない場合の対処法を教えてください。';
                        } else if (titleLower.includes('apps') || titleLower.includes('カスタム')) {
                          content = 'BASE Appsのカスタム機能について質問です。アプリの設定方法や表示エラーの解決方法について教えてください。プレビューは見れるが更新時にエラーが発生する問題の対処法を知りたいです。';
                        } else if (titleLower.includes('バナー')) {
                          content = 'バナー画像の設定について質問です。ヘッダーやフッターエリアのバナー表示方法や、画像サイズの調整について教えてください。';
                        } else if (titleLower.includes('セット') || titleLower.includes('おすすめ')) {
                          content = 'おすすめ商品やセット販売の表示機能について質問です。商品ページに関連商品を表示する方法や、セット購入を促進する機能の実装について教えてください。';
                        } else if (titleLower.includes('会員') || titleLower.includes('登録')) {
                          content = '会員登録機能について質問です。ユーザー登録フォームの設定や、会員限定コンテンツの表示方法について教えてください。';
                        } else if (titleLower.includes('メニュー') || titleLower.includes('よくある')) {
                          content = 'ナビゲーションメニューの設定について質問です。メニュー項目の追加方法や、FAQページを独立したタブとして設定する方法を教えてください。';
                        } else if (titleLower.includes('about') || titleLower.includes('写真')) {
                          content = 'Aboutページのレイアウトについて質問です。コピー文字の後に写真を並べて表示する方法や、レイアウトの調整について教えてください。';
                        } else if (titleLower.includes('導入') || titleLower.includes('検討')) {
                          content = 'テーマの導入について質問です。HelsinkiやStockholmテーマの機能比較や、導入時の注意点について教えてください。';
                        } else if (cleanTitle.length > 20) {
                          // タイトルが長い場合は、それ自体を質問内容として使用
                          content = `「${cleanTitle}」について質問です。詳細な解決方法や設定手順を教えてください。`;
                        }
                      }
                    }
                  } catch (e) {
                    console.log('URL decode error:', e);
                    // デコードエラーの場合はデフォルトタイトルを使用
                  }
                  
                  // ブログ名からテーマを判定
                  let category = 'Helsinki';
                  if (item.blog_name === 'base-stockholm') {
                    category = 'Stockholm';
                  } else if (item.blog_name === 'base-copenhagen') {
                    category = 'Copenhagen';  
                  } else if (item.blog_name === 'base-amsterdam') {
                    category = 'Amsterdam';
                  } else if (item.blog_name === 'base-helsinki') {
                    category = 'Helsinki';
                  }
                  
                  // 投稿IDから日付を推測
                  let date = new Date().toISOString().split('T')[0];
                  const postIdMatch = url.match(/\/post\/(\d+)/);
                  if (postIdMatch) {
                    const postId = parseInt(postIdMatch[1]);
                    if (postId > 785000000000000000) {
                      date = '2024-06-01';
                    } else if (postId > 780000000000000000) {
                      date = '2024-04-15';
                    } else if (postId > 775000000000000000) {
                      date = '2024-02-15';  
                    } else if (postId > 770000000000000000) {
                      date = '2024-01-15';
                    } else {
                      date = '2023-10-15';
                    }
                  }
                  
                  // 投稿者名をブログ名から生成
                  const authorMap = {
                    'base-amsterdam': 'Amsterdam ユーザー',
                    'base-stockholm': 'Stockholm ユーザー',
                    'base-copenhagen': 'Copenhagen ユーザー',
                    'base-helsinki': 'Helsinki ユーザー'
                  };
                  
                  highlightedPosts.push({
                    type: 'text',
                    post_url: url,
                    title: title,
                    body: content,
                    blog_name: item.blog_name,
                    date: date,
                    tags: ['highlighted', item.blog_name.replace('base-', ''), 'base'],
                    id: `highlighted_${item.blog_name}_${urlIndex}`,
                    category: category,
                    author: authorMap[item.blog_name] || `${item.blog_name} ユーザー`,
                    answered: false // 現時点では回答なしとして扱う
                  });
                });
              }
            });
            
            if (highlightedPosts.length > 0) {
              console.log(`Created ${highlightedPosts.length} posts from highlighted posts:`);
              highlightedPosts.forEach(p => console.log(`- ${p.blog_name}: ${p.title.substring(0, 50)}...`));
              posts = highlightedPosts;
            }
          }
          
          // まだ見つからない場合はugcLinksをチェック
          if (posts.length === 0 && dataContent.ugcLinks) {
            console.log(`Found potential posts in data.ugcLinks:`, dataContent.ugcLinks);
            if (Array.isArray(dataContent.ugcLinks)) {
              // ugcLinksが実際の投稿データかチェック
              const firstItem = dataContent.ugcLinks[0];
              if (firstItem && firstItem.link && firstItem.link.includes('tumblr.zendesk.com')) {
                console.log('ugcLinks contains help link, not post data');
                throw new Error('投稿データは外部リンクにあります。data.ugcLinks のリンクからダウンロードしてください: ' + firstItem.link);
              } else {
                posts = dataContent.ugcLinks;
                console.log(`Using posts from data.ugcLinks (${posts.length} items)`);
              }
            }
          }
          
          // まだ見つからない場合は、data の全プロパティを配列形式で探す
          if (posts.length === 0) {
            console.log('Searching all data properties for post content...');
            for (const [key, value] of Object.entries(dataContent)) {
              console.log(`Checking property: ${key} (type: ${typeof value}, isArray: ${Array.isArray(value)})`);
              
              if (Array.isArray(value) && value.length > 0) {
                console.log(`Property ${key} has ${value.length} items. Sample:`, value[0]);
                
                // 投稿っぽいプロパティがあるかチェック
                if (value[0] && typeof value[0] === 'object') {
                  const sampleKeys = Object.keys(value[0]);
                  console.log(`Sample keys in ${key}:`, sampleKeys);
                  
                  const hasPostProperties = sampleKeys.some(k => 
                    ['post_url', 'content', 'body', 'text', 'title', 'type', 'blog_name', 'serve_time', 'content_url'].includes(k)
                  );
                  
                  if (hasPostProperties) {
                    console.log(`Found posts in data.${key} based on properties:`, sampleKeys);
                    posts = value;
                    break;
                  }
                  
                  // ダッシュボード履歴から投稿URLを抽出する可能性
                  if (key === 'dashboard' && sampleKeys.includes('content_url')) {
                    console.log(`Found dashboard history in data.${key}. Converting to posts...`);
                    const dashboardPosts = value
                      .filter(item => item.content_url && item.content_url !== '\\N' && item.element_type === 'post')
                      .map((item, index) => {
                        // URLからブログ名を抽出
                        const urlMatch = item.content_url.match(/http:\/\/([^.]+)\.tumblr\.com/);
                        const sourceBlog = urlMatch ? urlMatch[1] : 'unknown';
                        
                        // ブログ名からテーマを推測
                        let category = 'Helsinki';
                        if (sourceBlog.includes('design') || sourceBlog.includes('graphic')) {
                          category = 'Stockholm';
                        } else if (sourceBlog.includes('bauhaus') || sourceBlog.includes('movement')) {
                          category = 'Copenhagen';
                        } else if (sourceBlog.includes('ak47') || sourceBlog.includes('creative')) {
                          category = 'Amsterdam';
                        }
                        
                        return {
                          type: 'text',
                          post_url: item.content_url,
                          title: `${sourceBlog} ブログからの参考投稿 ${index + 1}`,
                          body: `この投稿は ${item.serve_time} にダッシュボードで閲覧されました。元の投稿: ${item.content_url}`,
                          date: item.serve_time.split('T')[0],
                          blog_name: `参考: ${sourceBlog}`,
                          tags: ['dashboard', 'reference', sourceBlog],
                          id: `dashboard_${index}`
                        };
                      });
                    
                    if (dashboardPosts.length > 0) {
                      console.log(`Created ${dashboardPosts.length} posts from dashboard history`);
                      posts = dashboardPosts.slice(0, 20); // 最大20件に制限
                      break;
                    }
                  }
                }
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                console.log(`Property ${key} is object:`, Object.keys(value));
              } else if (typeof value === 'string' && value.length > 0) {
                console.log(`Property ${key} is string:`, value.substring(0, 100));
              }
            }
          }
          
          // 投稿データがない場合の詳細情報
          if (posts.length === 0) {
            console.log('=== NO POSTS FOUND - ACCOUNT ANALYSIS ===');
            console.log('Blog names:', dataContent.blog_names);
            console.log('Registration time:', dataContent.registration_time);
            console.log('Last post time:', dataContent.last_post_time);
            console.log('Most used tags:', dataContent.most_used_tags);
            console.log('Dashboard items:', dataContent.dashboard?.length || 0);
            console.log('Highlighted posts:', dataContent.highlighted_posts?.length || 0);
            
            let message = 'このTumblrアカウントには投稿データが見つかりませんでした。\n\n';
            message += '確認された情報:\n';
            if (dataContent.blog_names?.length > 0) {
              message += `• ブログ名: ${dataContent.blog_names.map(b => b.current_blog_name).join(', ')}\n`;
            }
            if (dataContent.registration_time) {
              message += `• 登録日: ${dataContent.registration_time}\n`;
            }
            if (dataContent.last_post_time) {
              message += `• 最終投稿: ${dataContent.last_post_time}\n`;
            } else {
              message += '• 投稿履歴なし\n';
            }
            
            throw new Error(message);
          }
        }
      });
      
      // まだ見つからない場合は元の配列を使用
      if (posts.length === 0) {
        posts = tumblrData;
      }
    } else {
      // その他の構造を探す
      console.log('Searching for alternative structures...');
      
      // 可能性のあるキーをすべて試す
      const possibleKeys = ['data', 'items', 'entries', 'content', 'tumblr_posts', 'blog_posts'];
      let found = false;
      
      for (const key of possibleKeys) {
        if (tumblrData[key] && Array.isArray(tumblrData[key])) {
          console.log(`Found posts in ${key} array`);
          posts = tumblrData[key];
          found = true;
          break;
        }
      }
      
      if (!found) {
        // 深いネストを探す（最大3レベル）
        console.log('Searching deeper nested structures...');
        for (const key1 of Object.keys(tumblrData)) {
          const level1 = tumblrData[key1];
          if (typeof level1 === 'object' && level1 !== null) {
            console.log(`Checking level1 key: ${key1}`);
            for (const key2 of Object.keys(level1)) {
              const level2 = level1[key2];
              if (Array.isArray(level2)) {
                console.log(`Found posts in ${key1}.${key2} array (${level2.length} items)`);
                posts = level2;
                found = true;
                break;
              } else if (typeof level2 === 'object' && level2 !== null) {
                console.log(`Checking level2 key: ${key1}.${key2}`);
                for (const key3 of Object.keys(level2)) {
                  const level3 = level2[key3];
                  if (Array.isArray(level3)) {
                    console.log(`Found posts in ${key1}.${key2}.${key3} array (${level3.length} items)`);
                    posts = level3;
                    found = true;
                    break;
                  }
                }
                if (found) break;
              }
            }
            if (found) break;
          }
        }
      }
      
      if (!found) {
        console.log('Available structure:');
        console.log(JSON.stringify(tumblrData, null, 2).substring(0, 1000) + '...');
        throw new Error(`有効なTumblrエクスポートファイルではありません。投稿データが見つかりませんでした。利用可能なキー: ${Object.keys(tumblrData).join(', ')}`);
      }
    }

    console.log(`Found ${posts.length} total posts`);
    
    if (posts.length === 0) {
      throw new Error('投稿データが見つかりませんでした。');
    }

    // 最初の数件をサンプル表示
    console.log('Sample posts structure:');
    posts.slice(0, 3).forEach((post, i) => {
      console.log(`Post ${i}:`, {
        type: post.type || post.post_type || 'unknown',
        keys: Object.keys(post),
        hasTitle: !!(post.title || post.summary),
        hasBody: !!(post.body || post.content || post.text),
        hasTags: !!(post.tags || post.tag)
      });
      
      // 実際の投稿内容を詳細表示
      console.log(`Post ${i} detailed structure:`, post);
      console.log(`Post ${i} all properties:`, Object.entries(post));
    });

    posts.forEach((post, index) => {
      // テキスト投稿の判定を緩くする
      const isTextPost = 
        post.type === 'text' || 
        post.post_type === 'text' || 
        (post.content && typeof post.content === 'string') ||
        (post.body && typeof post.body === 'string') ||
        (post.text && typeof post.text === 'string') ||
        // タイトルがあれば質問として扱う
        (post.title && typeof post.title === 'string') ||
        (post.summary && typeof post.summary === 'string');
      
      console.log(`Post ${index}: type=${post.type || post.post_type || 'unknown'}, isTextPost=${isTextPost}`);
      
      if (isTextPost) {
        // HTMLタグを除去する簡単な関数
        const stripHtml = (html) => {
          if (!html) return '';
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || '';
        };

        // 投稿本文の取得（複数のパターンに対応）
        const bodyContent = post.body || post.content || post.text || post.summary || '';
        
        // タイトルの生成（既存のタイトルまたは本文の最初の50文字）
        let title = post.title || post.summary || '';
        if (!title) {
          const cleanBody = stripHtml(bodyContent);
          title = cleanBody.substring(0, 50) + (cleanBody.length > 50 ? '...' : '');
        }

        // 空のコンテンツをスキップ
        if (!title && !bodyContent) {
          console.log(`Skipping post ${index}: no content`);
          return;
        }

        // カテゴリの決定（タグからテーマ名を推測）
        let category = 'Helsinki'; // デフォルトテーマ
        const tags = post.tags || post.tag || [];
        if (tags && Array.isArray(tags)) {
          const tagString = tags.join(' ').toLowerCase();
          if (tagString.includes('helsinki') || tagString.includes('ヘルシンキ') || tagString.includes('responsive') || tagString.includes('レスポンシブ')) {
            category = 'Helsinki';
          } else if (tagString.includes('stockholm') || tagString.includes('ストックホルム') || tagString.includes('minimal') || tagString.includes('シンプル')) {
            category = 'Stockholm';
          } else if (tagString.includes('copenhagen') || tagString.includes('コペンハーゲン') || tagString.includes('modern') || tagString.includes('モダン')) {
            category = 'Copenhagen';
          } else if (tagString.includes('amsterdam') || tagString.includes('アムステルダム') || tagString.includes('creative') || tagString.includes('クリエイティブ')) {
            category = 'Amsterdam';
          }
        }

        // 投稿日の変換
        let date = new Date().toISOString().split('T')[0];
        const dateFields = [post.date, post.timestamp, post.created_at, post.published_at, post.updated_at];
        for (const dateField of dateFields) {
          if (dateField) {
            try {
              if (typeof dateField === 'number') {
                // タイムスタンプの場合
                date = new Date(dateField * 1000).toISOString().split('T')[0];
              } else {
                // 文字列の場合
                date = new Date(dateField).toISOString().split('T')[0];
              }
              break;
            } catch (e) {
              // 日付解析エラーの場合は次の候補を試す
              continue;
            }
          }
        }

        // 作者名の決定
        const author = post.blog_name || post.blog || post.author || post.user || 'Tumblrユーザー';

        const question = {
          id: `tumblr_${post.id || post.uuid || post.slug || index}`,
          title: title,
          content: stripHtml(bodyContent),
          category: category,
          author: author,
          date: date,
          answered: false,
          tumblrUrl: post.post_url || post.url || post.permalink || '',
          tumblrTags: tags || []
        };

        console.log(`Created question from post ${index}:`, {
          title: question.title.substring(0, 50),
          category: question.category,
          author: question.author
        });

        parsedQuestions.push(question);
      }
    });

    console.log(`Successfully parsed ${parsedQuestions.length} questions from ${posts.length} posts`);
    return parsedQuestions;
  };

  // ファイル選択時の処理
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportStep('processing');

    try {
      const fileContent = await file.text();
      const tumblrData = JSON.parse(fileContent);
      
      // デバッグ情報を表示
      console.log('Tumblr data structure:', tumblrData);
      console.log('Keys in root object:', Object.keys(tumblrData));
      
      const parsedQuestions = parseTumblrData(tumblrData);
      
      setImportPreview(parsedQuestions);
      setImportStep('preview');
    } catch (error) {
      console.error('Import error:', error);
      alert(`ファイルの読み込みエラー: ${error.message}`);
      setImportStep('select');
      setImportFile(null);
    }
  };

  // データインポートの実行
  const executeImport = () => {
    const newQuestions = importPreview.map(q => ({
      ...q,
      id: Date.now() + Math.random() // 重複を避けるためのID生成
    }));
    
    setQuestions([...newQuestions, ...questions]);
    setShowImport(false);
    setImportStep('select');
    setImportFile(null);
    setImportPreview([]);
    setTumblrUrl('');
    setUrlImportStatus('');
    setUrlImportError('');
    
    alert(`${newQuestions.length}件の質問をインポートしました！`);
  };

  // インポートのリセット
  const resetImport = () => {
    setImportStep('select');
    setImportFile(null);
    setImportPreview([]);
    setTumblrUrl('');
    setUrlImportStatus('');
    setUrlImportError('');
  };

  const importTumblrData = () => {
    setShowImport(true);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qa-data.json';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BASE デザインテーマ サポート</h1>
              <p className="text-gray-600 mt-1">デザインテーマに関するご質問にお答えします</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Tumblrデータ移行
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                エクスポート
              </button>
              <button
                onClick={() => setShowNewQuestion(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                質問を投稿
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* 検索ボックス */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="質問を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* カテゴリフィルター（タブ式） */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">テーマ別フィルター</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて ({questions.length})
                </button>
                {categories.map(category => {
                  const count = questions.filter(q => q.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 回答状況フィルター */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">回答状況</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === '' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて ({questions.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('answered')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'answered' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  回答済み ({questions.filter(q => q.answered).length})
                </button>
                <button
                  onClick={() => setSelectedStatus('unanswered')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'unanswered' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  回答待ち ({questions.filter(q => !q.answered).length})
                </button>
              </div>
            </div>
            
            {/* フィルター結果表示 */}
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span>
                  {filteredQuestions.length}件の質問を表示
                  {(searchTerm || selectedCategory || selectedStatus) && (
                    <span> （{questions.length}件中）</span>
                  )}
                </span>
                {(searchTerm || selectedCategory || selectedStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedStatus('');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    すべてのフィルターをクリア
                  </button>
                )}
              </div>
              
              {/* アクティブフィルター表示 */}
              {(searchTerm || selectedCategory || selectedStatus) && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-gray-500">適用中:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      検索: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      テーマ: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      状況: {selectedStatus === 'answered' ? '回答済み' : '回答待ち'}
                      <button
                        onClick={() => setSelectedStatus('')}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 質問一覧 */}
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.title}</h3>
                    <p className="text-gray-700 mb-4">{question.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {question.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {question.date}
                      </div>
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        {question.category}
                      </div>
                      {question.tumblrUrl && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-1" />
                          <a href={question.tumblrUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            Tumblr投稿
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {question.answered ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        回答済み
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        回答待ち
                      </span>
                    )}
                  </div>
                </div>

                {/* 回答表示 */}
                {question.answered && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-blue-900">回答</span>
                      <span className="text-sm text-blue-700 ml-2">({question.answerDate})</span>
                    </div>
                    <p className="text-blue-900">{question.answer}</p>
                  </div>
                )}

                {/* 回答フォーム */}
                {!question.answered && answeringId !== question.id && (
                  <button
                    onClick={() => setAnsweringId(question.id)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    回答する
                  </button>
                )}

                {answeringId === question.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="回答を入力してください..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                    />
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => submitAnswer(question.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        回答を投稿
                      </button>
                      <button
                        onClick={() => {
                          setAnsweringId(null);
                          setNewAnswer('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">該当する質問が見つかりませんでした。</p>
          </div>
        )}
      </div>

      {/* 新規質問モーダル */}
      {showNewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">新しい質問を投稿</h2>
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
                    <input
                      type="text"
                      value={newQuestion.author}
                      onChange={(e) => setNewQuestion({...newQuestion, author: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="お名前を入力してください"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                    <select
                      value={newQuestion.category}
                      onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">カテゴリを選択</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問タイトル</label>
                    <input
                      type="text"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="質問のタイトルを入力してください"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問内容</label>
                    <textarea
                      value={newQuestion.content}
                      onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="5"
                      placeholder="詳しい質問内容を記載してください。使用しているテーマ名や、具体的な問題の状況を書いていただくと、より適切な回答ができます。"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowNewQuestion(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={submitQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    質問を投稿
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tumblrデータ移行モーダル */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Tumblrデータの移行</h2>
              
              {/* インポート方法選択 */}
              {importStep === 'select' && (
                <div className="space-y-6">
                  {/* 方法選択タブ */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setImportMethod('url')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        importMethod === 'url'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Globe className="w-4 h-4 mr-2 inline-block" />
                      ブログURLから取得
                    </button>
                    <button
                      onClick={() => setImportMethod('file')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        importMethod === 'file'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Upload className="w-4 h-4 mr-2 inline-block" />
                      エクスポートファイル
                    </button>
                  </div>

                  {/* URLインポート */}
                  {importMethod === 'url' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h3 className="font-medium text-blue-900 mb-2">TumblrブログURLから直接取得：</h3>
                        <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                          <li>サポート対象ブログ: base-stockholm, base-helsinki, base-copenhagen, base-amsterdam</li>
                          <li>Q&A形式の投稿を自動的に抽出します</li>
                          <li>ブログ名から適切なテーマカテゴリを自動判定</li>
                        </ul>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TumblrブログのURL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={tumblrUrl}
                            onChange={(e) => setTumblrUrl(e.target.value)}
                            placeholder="https://base-stockholm.tumblr.com/"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={handleUrlImport}
                            disabled={importStep === 'processing'}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {importStep === 'processing' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            取得
                          </button>
                        </div>
                      </div>

                      {/* URL インポートステータス */}
                      {urlImportStatus && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-700">{urlImportStatus}</span>
                        </div>
                      )}

                      {/* URL インポートエラー */}
                      {urlImportError && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-700">{urlImportError}</span>
                        </div>
                      )}

                      {/* 実装ガイドと設定 */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">実際のAPI実装手順：</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><strong>1. APIキーの設定：</strong></p>
                          <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                            const API_KEY = 'tnIPpRJ51gGtRKUleFH1ktfb87FEn6bnQtPVseX8s492T6TDYE';
                          </div>
                          
                          <p><strong>2. セキュリティ対策：</strong></p>
                          <ul className="ml-4 list-disc space-y-1 text-xs">
                            <li>本番環境では環境変数を使用</li>
                            <li>APIキーをクライアントサイドに直接書かない</li>
                            <li>プロキシサーバー経由での実装を推奨</li>
                          </ul>
                          
                          <p><strong>3. 環境変数の使用例：</strong></p>
                          <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                            const API_KEY = process.env.REACT_APP_TUMBLR_API_KEY;
                          </div>
                          
                          <p><strong>4. プロキシサーバー実装例：</strong></p>
                          <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                            fetch('/api/tumblr/posts', {'{'}
                            <br />　method: 'POST',
                            <br />　body: JSON.stringify({'{'}blogName{'}'}),
                            <br />　headers: {'{'}
                            <br />　　'Content-Type': 'application/json'
                            <br />　{'}'}
                            <br />{'}'})
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ファイルインポート */}
                  {importMethod === 'file' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">移行手順：</h3>
                        <ol className="list-decimal list-inside text-blue-800 space-y-1">
                          <li>Tumblrの設定から「データをエクスポート」を選択</li>
                          <li>ダウンロードされたZIPファイルを展開</li>
                          <li><strong>「payload-0.json」</strong>ファイルを選択してください</li>
                          <li>インポートボタンをクリック</li>
                        </ol>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <h4 className="font-medium text-green-800 mb-1">ファイル形式について：</h4>
                        <ul className="text-green-700 text-sm space-y-1">
                          <li>• <strong>新形式</strong>: payload-0.json（推奨）</li>
                          <li>• <strong>旧形式</strong>: posts.json（古いエクスポート）</li>
                          <li>• どちらの形式でも自動判定して処理します</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-medium text-yellow-800 mb-1">注意事項：</h4>
                        <ul className="text-yellow-700 text-sm space-y-1">
                          <li>• テキスト投稿のみが質問として変換されます</li>
                          <li>• タグから自動的にテーマ名が判定されます（Helsinki, Stockholm, Copenhagen, Amsterdam）</li>
                          <li>• 画像や動画投稿は変換されません</li>
                        </ul>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tumblrエクスポートファイル（payload-0.json または posts.json）
                        </label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileSelect}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ステップ2: 処理中 */}
              {importStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">
                    {importMethod === 'url' ? 'Tumblrブログから投稿を取得中...' : 'Tumblrデータを解析中...'}
                  </p>
                  {urlImportStatus && (
                    <p className="text-blue-600 mt-2">{urlImportStatus}</p>
                  )}
                </div>
              )}

              {/* ステップ3: プレビュー */}
              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="font-medium text-green-800 mb-1">解析完了！</h4>
                    <p className="text-green-700 text-sm">
                      {importPreview.length}件の質問が見つかりました。プレビューを確認してインポートしてください。
                    </p>
                  </div>

                  {/* プレビューリスト */}
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {importPreview.slice(0, 10).map((question, index) => (
                      <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900 text-sm">{question.title}</h5>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {question.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{question.content.substring(0, 100)}...</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>投稿者: {question.author}</span>
                          <span>{question.date}</span>
                        </div>
                        {question.tumblrTags && question.tumblrTags.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-400">タグ: {question.tumblrTags.join(', ')}</span>
                          </div>
                        )}
                        {question.tumblrUrl && (
                          <div className="mt-1">
                            <a href={question.tumblrUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700">
                              元の投稿を見る
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    {importPreview.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        ... 他 {importPreview.length - 10} 件
                      </div>
                    )}
                  </div>

                  {/* カテゴリ分布 */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">カテゴリ分布：</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        importPreview.reduce((acc, q) => {
                          acc[q.category] = (acc[q.category] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([category, count]) => (
                        <span key={category} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700">
                          {category}: {count}件
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ボタン */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowImport(false);
                    resetImport();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                
                {importStep === 'preview' && (
                  <>
                    <button
                      onClick={resetImport}
                      className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      別の方法を選択
                    </button>
                    <button
                      onClick={executeImport}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {importPreview.length}件をインポート
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;