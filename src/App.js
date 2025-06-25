import React, { useState } from 'react';
import { Search, Plus, MessageCircle, Clock, User, Tag, Upload, Download } from 'lucide-react';

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

  const categories = ['Helsinki', 'Stockholm', 'Copenhagen', 'Amsterdam'];

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

  // Tumblrデータ解析関数
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
                  try {
                    // URLの最後の部分からタイトルを抽出
                    const urlParts = url.split('/');
                    const lastPart = urlParts[urlParts.length - 1];
                    if (lastPart && lastPart.length > 10) {
                      // URLエンコードされた日本語をデコード
                      const decodedTitle = decodeURIComponent(lastPart.replace(/-/g, ' '));
                      if (decodedTitle.length > 5 && decodedTitle.length < 100) {
                        title = decodedTitle.substring(0, 60) + (decodedTitle.length > 60 ? '...' : '');
                      }
                    }
                  } catch (e) {
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
                  
                  // 投稿内容を生成
                  let content = `この質問は ${item.blog_name} ブログのハイライト投稿です。`;
                  
                  // タイトルから内容を推測
                  const titleLower = title.toLowerCase();
                  if (titleLower.includes('instagram') || titleLower.includes('インスタ')) {
                    content = 'Instagram連携機能について。設定方法や表示に関する質問です。';
                  } else if (titleLower.includes('apps') || titleLower.includes('アプリ')) {
                    content = 'BASE Appsの機能追加や設定について。カスタム機能の実装に関する質問です。';
                  } else if (titleLower.includes('バナー') || titleLower.includes('banner')) {
                    content = 'バナー画像の設定や表示について。ヘッダーやフッターエリアのカスタマイズに関する質問です。';
                  } else if (titleLower.includes('セット') || titleLower.includes('おすすめ')) {
                    content = 'おすすめ商品やセット販売の表示機能について。商品ページのカスタマイズに関する質問です。';
                  } else if (titleLower.includes('会員') || titleLower.includes('登録')) {
                    content = '会員登録機能について。ユーザー登録やログイン機能のカスタマイズに関する質問です。';
                  } else if (titleLower.includes('メニュー') || titleLower.includes('ナビ')) {
                    content = 'ナビゲーションメニューの設定について。メニュー項目の追加や表示に関する質問です。';
                  } else if (titleLower.includes('about') || titleLower.includes('写真')) {
                    content = 'Aboutページのレイアウトについて。写真の配置や表示方法に関する質問です。';
                  }
                  
                  // 投稿IDから日付を推測（Tumblrの投稿IDは時系列）
                  let date = new Date().toISOString().split('T')[0];
                  const postIdMatch = url.match(/\/post\/(\d+)/);
                  if (postIdMatch) {
                    const postId = parseInt(postIdMatch[1]);
                    // Tumblr投稿IDから大まかな日付を推測（非常に大雑把）
                    if (postId > 780000000000000000) {
                      date = '2024-04-15';
                    } else if (postId > 770000000000000000) {
                      date = '2024-01-15';  
                    } else {
                      date = '2023-10-15';
                    }
                  }
                  
                  highlightedPosts.push({
                    type: 'text',
                    post_url: url,
                    title: title,
                    body: content,
                    blog_name: item.blog_name,
                    date: date,
                    tags: ['highlighted', item.blog_name.replace('base-', ''), 'base'],
                    id: `highlighted_${item.blog_name}_${urlIndex}`,
                    category: category
                  });
                });
              }
            });
            
            if (highlightedPosts.length > 0) {
              console.log(`Created ${highlightedPosts.length} posts from highlighted posts:`, highlightedPosts.map(p => `${p.blog_name}: ${p.title}`));
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
    
    alert(`${newQuestions.length}件の質問をインポートしました！`);
  };

  // インポートのリセット
  const resetImport = () => {
    setImportStep('select');
    setImportFile(null);
    setImportPreview([]);
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
              
              {/* ステップ1: ファイル選択 */}
              {importStep === 'select' && (
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

              {/* ステップ2: 処理中 */}
              {importStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Tumblrデータを解析中...</p>
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
                        {question.tumblrTags.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-400">タグ: {question.tumblrTags.join(', ')}</span>
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
                      別のファイルを選択
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