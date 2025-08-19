// screens/Home.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, FlatList, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import debounce from 'lodash.debounce';
import {
  createTable,
  getMenuItems,
  saveMenuItems,
  filterByQueryAndCategories,
} from '../database';

const IMAGE_BASE =
  "https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/images/";

export default function Home() {
  const [data, setData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
   const [query, setQuery] = useState("");



    const fetchData = async() => {
   try {
      const response = await fetch('https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json');
   if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();

      const rawMenu = Array.isArray(json?.menu) ? json.menu : [];
      // Flatten + coerce types
      const menu = rawMenu ;
         setData(menu)
      return menu; // <- return the array for the DB layer
    } catch (error) {
      console.error('fetchData error:', error);
    }


    // Fetch the menu from the API_URL endpoint. You can visit the API_URL in your browser to inspect the data returned
    // The category field comes as an object with a property called "title". You just need to get the title value and set it under the key "category".
    // So the server response should be slighly transformed in this function (hint: map function) to flatten out each menu item in the array,
    return [];
  }


  useEffect(() => {
    //fetchData();
     fetchData();
    (async () => {
      try {
        await createTable();
        let menuItems = await getMenuItems();
  //if (!Array.isArray(menuItems)) menuItems = [];
        // The application only fetches the menu data once from a remote URL
        // and then stores it into a SQLite database.
        // After that, every application restart loads the menu from the database
        if (!menuItems.length) {
         const menuItems = fetchData();
         saveMenuItems(menuItems);

        }


       // const sectionListData = getSectionListData(menuItems);
        //  setData(sectionListData);
      } catch (e) {
        // Handle error
        Alert.alert(e.message);
      }
    })();
  }, []);






  const categories = useMemo(() => {
    const s = new Set();
    for (const item of data) if (item?.category) s.add(String(item.category));
    return Array.from(s).sort();
  }, [data]);

  const visibleData = useMemo(() => {
    if (!selectedCategories.length) return data;
    const set = new Set(selectedCategories);
    return data.filter((it) => set.has(String(it.category)));
  }, [data, selectedCategories]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }
  // Exposed change handler using a fresh debouncer each call
  const onSearchChange = useMemo(
    () => debounce((text) => setQuery(text), 500),
    []
  );
  useEffect(() => () => onSearchChange.cancel(), [onSearchChange]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.row}>
   
      <View style={styles.textBlock}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>${item.price}</Text>
      </View>
         <Image
        source={{ uri: `${IMAGE_BASE}${item.image}` }}
        style={styles.thumb}
        resizeMode="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${item.name} thumbnail`}
      />
    </View>
  );

  return (
    <View style={styles.container}>
          
            <View style={styles.top}>
              <Image
                source={require("../images/Logo.png")}
                style={styles.hero}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel="Welcome illustration"
              />
            </View>
          
        {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Little Lemon</Text>
          <Text style={styles.bannerSubtitle}>Chicago</Text>
          <Text style={styles.bannerDesc} numberOfLines={3}>
            We are a family owned Mediterranean restaurant focused on traditional
            recipes served with a modern twist.
          </Text>
          <TextInput
            placeholder="Search dishes…"
            placeholderTextColor="#9CA3AF"
            onChangeText={onSearchChange}
            style={styles.search}
            accessibilityLabel="Search dishes"
          />
        </View>
        <Image
          source={{ uri: `${IMAGE_BASE}greekSalad.jpg` }}
          style={styles.bannerImage}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Restaurant hero"
        />
      </View>

      {/* Horizontal Category Buttons (8px radius; grey default, yellow when selected) */}
       <Text style={styles.header}>ORDER FOR DELIVERY</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
      >
        {categories.map((cat) => {
          const selected = selectedCategories.includes(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => toggleCategory(cat)}
              style={({ pressed }) => [
                styles.catButton,
                selected && styles.catButtonSelected,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Category ${cat}`}
            >
              <Text style={styles.catText}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={visibleData}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text>Loading…</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  top: { padding: 20, marginBottom: 24, backgroundColor: "#eeee" },
  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 2,
    backgroundColor: "#495E57",
    marginBottom: 12,
  },
  bannerTextCol: { flex: 1 },
  bannerTitle: { color: "#F4CE14", fontSize: 24, fontWeight: "800" },
  bannerSubtitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 2 },
  bannerDesc: { color: "#E5E7EB", marginTop: 8 },
  bannerImage: { width: 100, height: 100, borderRadius: 6, backgroundColor: "#0B1220" },
  search: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },

  catList: { paddingBottom: 8 },




    hero: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Constant-height buttons

  catButton: {
    height: 36,                  // <- fixed height
    paddingHorizontal: 12,
    borderRadius: 8,             // 8px corners
    marginRight: 8,
    backgroundColor: "#D1D5DB",  // grey (default)
    alignItems: "center",
    justifyContent: "center",
  },
  catButtonSelected: {
    backgroundColor: "#F4CE14",  // yellow when selected
  },
  catText: {
    color: "#111827",
    fontWeight: "600",
    lineHeight: 18,              // stabilize text vertical size
  },


  // List rows (thumbnail left, text right)
  list: { paddingBottom: 24, marginTop: 8 },
  sep: { height: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  textBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  desc: { color: "#4b5563", marginTop: 2 },
  price: { marginTop: 6, fontWeight: "600" },
});
