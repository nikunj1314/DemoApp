import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import * as SQLite from 'expo-sqlite';

interface Character {
  id?: number;
  name: string;
  gender: string;
  culture: string;
  titles: string[];
}

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [listData, setListData] = useState<Character[]>([]);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('got.db');
      await createTable(database);
      await fetchAndStoreData(database);
    } catch (error) {
      console.error('Database initialization error:', error);
      setLoading(false);
    }
  };

  const createTable = async (database: SQLite.SQLiteDatabase) => {
    try {
      await database.runAsync(
        'CREATE TABLE IF NOT EXISTS characters (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, gender TEXT, culture TEXT, titles TEXT)'
      );
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const storeDataInDB = async (database: { runAsync: (arg0: string, arg1: any[] | undefined) => any; }, characters: any[]) => {
    try {
      await database.runAsync('DELETE FROM characters');

      for (const character of characters) {
        const titlesString = character.titles ? JSON.stringify(character.titles) : JSON.stringify([]);

        await database.runAsync(
          'INSERT INTO characters (name, gender, culture, titles) VALUES (?, ?, ?, ?)',
          [
            character.name || '',
            character.gender || '',
            character.culture || '',
            titlesString
          ]
        );
      }
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  };

  const fetchDataFromDB = async (database: { getAllAsync: (arg0: string) => any; }) => {
    try {
      const result = await database.getAllAsync('SELECT * FROM characters');

      return result.map((item: { titles: string; name: any; gender: any; culture: any; }) => ({
        ...item,
        titles: item.titles ? JSON.parse(item.titles) : [],
        name: item.name || null,
        gender: item.gender || null,
        culture: item.culture || null
      }));
    } catch (error) {
      console.error('Error fetching from DB:', error);
      throw error;
    }
  };

  const fetchAndStoreData = async (database: SQLite.SQLiteDatabase) => {
    const urls = [
      'https://anapioficeandfire.com/api/characters/300',
      'https://anapioficeandfire.com/api/characters/301',
      'https://anapioficeandfire.com/api/characters/302',
      'https://anapioficeandfire.com/api/characters/303',
    ];

    try {
      const requests = urls.map(url => fetch(url).then(res => res.json()));
      const results: Character[] = await Promise.all(requests);

      await storeDataInDB(database, results);

      const storedData = await fetchDataFromDB(database);
      setListData(storedData);
      setLoading(false);
    } catch (error) {
      console.error('Error in data flow:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (listData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView />
      <FlatList
        data={listData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.nameText}>{item.name}</Text>

            <View style={[styles.rowFlex, styles.top1]}>
              {item.gender && <Text style={styles.infoText}>{item.gender}</Text>}
              {item.culture && (
                <Text style={styles.infoText}>
                  {item.gender ? "  |  " : ""}{item.culture}
                </Text>
              )}
            </View>

            {item.titles && item.titles.length > 0 && (
              <View style={[styles.rowFlex, styles.top1]}>
                {item.titles.map((title, index) => (
                  <View key={index} style={styles.rowFlex}>
                    <Text style={styles.titleText}>{title}</Text>
                    {index !== item.titles.length - 1 && (
                      <Text style={styles.titleText}>{" | "}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 25,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  top1: {
    marginTop: 5
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600'
  },
  infoText: {
    fontSize: 16,
    color: 'gray'
  },
  titleText: {
    fontSize: 14,
    color: "green"
  }
});

export default App;
