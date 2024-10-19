import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@todo_list_key';

export default function App() {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showHighPriority, setShowHighPriority] = useState(true);
  const [showNormalTasks, setShowNormalTasks] = useState(true);
  const MAX_TASK_LENGTH = 50;

  // โหลดข้อมูลเมื่อแอปเริ่มทำงาน
  useEffect(() => {
    loadTasks();
  }, []);

  // ฟังก์ชันสำหรับบันทึกข้อมูลลง AsyncStorage
  const saveTasks = async (tasks) => {
    try {
      const jsonValue = JSON.stringify(tasks);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
      console.error('Error saving tasks:', error);
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลจาก AsyncStorage
  const loadTasks = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const loadedTasks = JSON.parse(jsonValue);
        // แปลงวันที่กลับเป็น Date object
        const tasksWithDates = loadedTasks.map(task => ({
          ...task,
          dueDate: new Date(task.dueDate)
        }));
        setTaskList(tasksWithDates);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
      console.error('Error loading tasks:', error);
    }
  };

  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
  };

  const addTask = async () => {
    if (task.trim() !== '') {
      if (task.length > MAX_TASK_LENGTH) {
        Alert.alert('Error', `Task name cannot exceed ${MAX_TASK_LENGTH} characters`);
        return;
      }
      const newTaskList = [
        ...taskList,
        {
          key: Math.random().toString(),
          value: task,
          dueDate: date,
          dueDateString: date.toLocaleDateString('th-TH'),
        },
      ];
      setTaskList(newTaskList);
      await saveTasks(newTaskList);
      setTask('');
      setDate(new Date());
    }
  };

  const removeTask = async (taskKey) => {
    const newTaskList = taskList.filter((task) => task.key !== taskKey);
    setTaskList(newTaskList);
    await saveTasks(newTaskList);
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskContainer}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskText}>{item.value}</Text>
        <Text style={styles.dateText}>กำหนดส่ง: {item.dueDateString}</Text>
        <Text style={styles.daysLeftText}>
          เหลือเวลา {calculateDaysUntilDue(item.dueDate)} วัน
        </Text>
      </View>
      <Button
        title="Remove"
        onPress={() => removeTask(item.key)}
        color="#ff4545"
      />
    </View>
  );

  const highPriorityTasks = taskList.filter(
    task => calculateDaysUntilDue(task.dueDate) <= 7
  );

  const normalTasks = taskList.filter(
    task => calculateDaysUntilDue(task.dueDate) > 7
  );

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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addTask}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {highPriorityTasks.length > 0 && (
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowHighPriority(!showHighPriority)}
          >
            <Text style={styles.sectionTitleHigh}>
              High Priority Tasks ({highPriorityTasks.length})
            </Text>
            <Text style={styles.dropdownIcon}>
              {showHighPriority ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {showHighPriority && (
            <FlatList
              data={highPriorityTasks}
              renderItem={renderTaskItem}
              style={[styles.highPriorityList, styles.limitedList]}
            />
          )}
        </View>
      )}

      {normalTasks.length > 0 && (
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setShowNormalTasks(!showNormalTasks)}
          >
            <Text style={styles.sectionTitle}>
              Normal Tasks ({normalTasks.length})
            </Text>
            <Text style={styles.dropdownIcon}>
              {showNormalTasks ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {showNormalTasks && (
            <FlatList
              data={normalTasks}
              renderItem={renderTaskItem}
              style={[styles.normalList, styles.limitedList]}
            />
          )}
        </View>
      )}
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
    width: Platform.OS === 'ios' ? 90 : 110,
    marginRight: 10,
  },
  datePicker: {
    width: '100%',
    height: 35,
    marginTop: Platform.OS === 'ios' ? -10 : 0,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
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
  sectionTitleHigh: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#de4b4b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 18,
    color: '#666',
  },
  highPriorityList: {
    backgroundColor: '#fff3f3',
  },
  normalList: {
    backgroundColor: '#f5f5f5',
  },
  limitedList: {
    maxHeight: (Platform.OS === 'ios' ? 85 : 90) * 3, // ประมาณความสูงของ 3 รายการ
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
    marginHorizontal: 5,
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
    marginBottom: 3,
  },
  daysLeftText: {
    fontSize: 12,
    color: '#ff776e',
  },
  addButton: {
    backgroundColor: '#60a5eb',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});