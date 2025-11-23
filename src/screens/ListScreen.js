import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Animated, TextInput, Keyboard, Platform } from "react-native";
import { useUser } from "../context/UserContext";
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

function TodoItem({ item, onToggle, onRemove }) {
  return (
    <View style={styles.itemRow}>
      <Pressable onPress={() => onToggle(item.id)} style={styles.left}>
        <MaterialIcons
          name={item.done ? "check-box" : "check-box-outline-blank"}
          size={24}
        />
        <Text style={[styles.title, item.done && styles.done]}>
          {item.title}
        </Text>
      </Pressable>
    </View>
  );
}

const MemoTodoItem = React.memo(TodoItem);

export default function ListScreen({ navigation }) {
  const { user } = useUser();
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const spin = useRef(new Animated.Value(0)).current;
  const inputWidth = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;

  const value = spin.interpolate({
    inputRange: [0,1],
    outputRange: ["0deg", "315deg"],
  });

  const bottomUp = useRef(new Animated.Value(30)).current;

  const [openInput, setOpeninput] = useState(false);

  const { getItem, setItem } = useAsyncStorage('key');

  const save = async (data) => {
    try {
        await setItem(data);
    } catch(e) {
        console.log(e);
    }
  };

  const load = async () => {
    const data = await getItem();
    return data ? JSON.parse(data) : [];
  };

  const toggleAll = () => {
    const allDone = todos.every((t) => t.done);
    setTodos((prev) => prev.map((t) => ({ ...t, done: !allDone })));
  };

  const removeAll = () => {
  };

  useEffect(() => {
  (async () => {
    const saved = await load();
    setTodos(saved);
  })();
  }, []);

  useEffect(() => {
    save(JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => {
        Animated.timing(bottomUp, {
            toValue: e.endCoordinates.height + 10,
            useNativeDriver : false,
        }).start();
    });

    const hide = Keyboard.addListener("keyboardWillHide", () => {
        Animated.timing(bottomUp, {
            toValue: 30,
            useNativeDriver: false,
        }).start();
    });

    return () => {
        show.remove();
        hide.remove();
    };
}, []);

  useEffect(() => {
    navigation.setOptions({
      title: user ? `${user.name}의 할 일` : "TODO LIST",
      headerRight: () => (
        <Pressable onPress={() => setTodos([])} style={{ marginRight: 12 }}>
            <MaterialIcons name="delete" size={28} color="red" />
        </Pressable>
      ),
    });
  }, [user, todos]);

  const toggleInput = () => {
    const next = !openInput;
    setOpeninput(next);

    Animated.spring(spin, {
        toValue: next ? 1 : 0,
        useNativeDriver: false,
    }).start();

    Animated.timing(inputWidth, {
        toValue: next ? 260 : 0,
        duration: 250,
        useNativeDriver: false,
    }).start();

    Animated.timing(inputOpacity, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
    }).start();
  };

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos((prev) => [
        ...prev,
        { id: Date.now(), title: text.trim(), done: false },
    ]);
    setText("");
    toggleInput();
  };

  const onToggle = useCallback((id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); }, []);

  const onRemove = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id)); }, []);

    return (
        <View style={styles.container}>
            <FlatList
            data={todos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <MemoTodoItem item={item} onToggle={onToggle} />
            )}
            
            ListEmptyComponent={() => (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>할 일을 추가해주세요</Text>
                </View>
    )} />

    <Animated.View
    style={[
        styles.fabContainer,
        { bottom: bottomUp, },
    ]}>
        <Animated.View
        style={[
            styles.inputBox,
            { width: inputWidth, opacity: inputOpacity },
        ]}>
            <TextInput
            value={text}
            onChangeText={setText}
            style={styles.input}
            onSubmitEditing={addTodo}
            returnKeyType="done" />

            <Pressable onPress={addTodo}>
                <MaterialIcons name="check" size={26} color="white" />
            </Pressable>
        </Animated.View>

        <Animated.View style={{ transform: [{ rotate: value }] }}>
            <Pressable style={styles.fab} onPress={toggleInput}>
                <MaterialIcons name="add" size={30} color="white" />
            </Pressable>
        </Animated.View>
    </Animated.View>
    </View>
    );
}

const buttonColor = "#3c74d4";

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
    width: "100%",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "gray" },
  emptyWrap: { alignItems: "center", justifyContent: "center", flex: 1 },
  emptyText: { fontSize: 16, color: "skyblue" },

  fabContainer: {
        position: "absolute",
        right: 20,
        flexDirection: "row",
        alignItems: "center",
    },

    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: buttonColor,
        alignItems: "center",
        justifyContent: "center",
    },

    inputBox: {
        height: 60,
        borderRadius: 30,
        marginRight: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: buttonColor,
    },

    input: {
        flex: 1,
        color: "white",
        fontSize: 17,
        marginRight: 10,
    },
});