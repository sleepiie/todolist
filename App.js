import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState([]);
  const [date, setDate] = useState(new Date());
  const MAX_TASK_LENGTH = 50;

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    Platform.OS === 'ios';
    setDate(currentDate);
  };

  const addTask = () => {
    if (task.trim() !== '') {
      if (task.length > MAX_TASK_LENGTH) {
        Alert.alert('Error', `Task name cannot exceed ${MAX_TASK_LENGTH} characters`);
        return;
      }
      setTaskList([
        ...taskList,
        {
          key: Math.random().toString(),
          value: task,
          dueDate: date.toLocaleDateString('th-TH'),
        },
      ]);
      setTask('');
      setDate(new Date());
    }
  };

  const removeTask = (taskKey) => {
    setTaskList(taskList.filter((task) => task.key !== taskKey));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter task"
          style={styles.input}
          value={task}
          onChangeText={(text) => setTask(text)}
          maxLength={MAX_TASK_LENGTH}
        />
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={onChange}
            minimumDate={new Date()}
            style={styles.datePicker}
            themeVariant="light"
          />
        </View>
        <Button title="Add" onPress={addTask} />
      </View>
      <FlatList
        data={taskList}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskText}>{item.value}</Text>
              <Text style={styles.dateText}>กำหนดส่ง: {item.dueDate}</Text>
            </View>
            <Button
              title="Remove"
              onPress={() => removeTask(item.key)}
              color="#ff4545"
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    padding: 10,
    flex: 1,
    marginRight: 10,
  },
  datePickerContainer: {
    width: Platform.OS === 'ios' ? 100 : 120,
    marginRight: 10,
  },
  datePicker: {
    width: '100%',
    height: 40,
    marginTop: Platform.OS === 'ios' ? -10 : 0,
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
});