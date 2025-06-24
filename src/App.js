import React, { useState } from 'react';
import { Search, Plus, MessageCircle, Clock, User, Tag, Upload, Download } from 'lucide-react';

const App = () => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: "スマホ表示でヘッダーメニューが崩れてしまいます",
      content: "レスポンシブデザインのテーマを使用していますが、スマートフォンで表示した時にヘッダーメニューが崩れてしまいます。CSSで修正方法を教えてください。",
      category: "レスポンシブ",
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
      category: "カスタマイズ",
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
      category: "デザイン",
      author: "佐藤次郎",
      date: "2025-06-15",
      answered: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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

  const categories = ['レスポンシブ', 'カスタマイズ', 'デザイン', 'トラブルシューティング', 'SEO', 'その他'];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const importTumblrData = () => {
    // 実際の実装では、TumblrのAPIまたはエクスポートデータを処理
    alert('Tumblrデータのインポート機能です。実際の実装ではJSON形式のエクスポートデータを読み込めます。');
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
          <div className="flex flex-col md:flex-row gap-4">
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Tumblrデータの移行</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">移行手順：</h3>
                  <ol className="list-decimal list-inside text-blue-800 space-y-1">
                    <li>Tumblrの設定からデータをエクスポート</li>
                    <li>JSON形式のファイルを選択</li>
                    <li>インポートボタンをクリック</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tumblrエクスポートファイル（JSON）
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImport(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={importTumblrData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  インポート実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;