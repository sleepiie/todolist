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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Checkbox } from 'react-native-paper';
import { Calendar } from 'lucide-react-native';

const STORAGE_KEY = '@todo_list_key';
const DONE_STORAGE_KEY = '@done_tasks_key';
const DONE_DAYS_LIMIT = 30;

export default function App() {
  const [task, setTask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showHighPriority, setShowHighPriority] = useState(true);
  const [showNormalTasks, setShowNormalTasks] = useState(true);
  const [showDoneTasks, setShowDoneTasks] = useState(true);
  const MAX_TASK_LENGTH = 50;

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadTasks(), loadDoneTasks()]);
      } catch (error) {
        console.error('Initial load error:', error);
        Alert.alert('Error', 'Failed to initialize app');
      }
    };
  
    loadData();
  
    const cleanupInterval = setInterval(cleanupDoneTasks, 86400000);
    return () => clearInterval(cleanupInterval);
  }, []);

  const saveDoneTasks = async (tasks) => {
    try {
      const jsonValue = JSON.stringify(tasks);
      await AsyncStorage.setItem(DONE_STORAGE_KEY, jsonValue);
    } catch (error) {
      Alert.alert('Error', 'Failed to save done tasks');
    }
  };


  const loadTasks = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const loadedTasks = JSON.parse(jsonValue);
        const tasksWithDates = loadedTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date() // เพิ่มการตรวจสอบ
        }));
        setTaskList(tasksWithDates);
      }
    } catch (error) {
      console.error('Load tasks error:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };
  
  const loadDoneTasks = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(DONE_STORAGE_KEY);
      if (jsonValue != null) {
        const loadedTasks = JSON.parse(jsonValue);
        const tasksWithDates = loadedTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
          completedDate: task.completedDate ? new Date(task.completedDate) : new Date()
        }));
        setDoneTasks(tasksWithDates);
      }
    } catch (error) {
      console.error('Load done tasks error:', error);
      Alert.alert('Error', 'Failed to load done tasks');
    }
  };

  const cleanupDoneTasks = () => {
    const currentDate = new Date();
    const updatedDoneTasks = doneTasks.filter(task => {
      const completedDate = new Date(task.completedDate);
      const diffTime = currentDate - completedDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= DONE_DAYS_LIMIT;
    });

    if (updatedDoneTasks.length !== doneTasks.length) {
      setDoneTasks(updatedDoneTasks);
      saveDoneTasks(updatedDoneTasks);
    }
  };

  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเป็น 00:00:00 เพื่อการเปรียบเทียบที่แม่นยำ
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const sortedTasks = taskList.sort((a, b) => {
    const daysA = calculateDaysUntilDue(a.dueDate);
    const daysB = calculateDaysUntilDue(b.dueDate);
    return daysA - daysB; // เรียงจากน้อยไปมาก
  });

  const sortedDoneTasks = doneTasks.sort((a, b) => {
    return new Date(b.completedDate) - new Date(a.completedDate);
  });

  const onChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
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
  const saveTasks = async (tasks) => {
    try {
      const jsonValue = JSON.stringify(tasks);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  const completeTask = async (taskKey) => {
    const taskToComplete = taskList.find(task => task.key === taskKey);
    if (taskToComplete) {
      // เพิ่ม task ไปยัง doneTasks พร้อมวันที่เสร็จ
      const completedTask = {
        ...taskToComplete,
        completedDate: new Date(),
      };
      const newDoneTasks = [...doneTasks, completedTask];
      setDoneTasks(newDoneTasks);
      await saveDoneTasks(newDoneTasks);

      // ลบ task จาก taskList
      const newTaskList = taskList.filter(task => task.key !== taskKey);
      setTaskList(newTaskList);
      await saveTasks(newTaskList);
    }
  };

  const removeTask = async (taskKey, isDoneTask = false) => {
    if (isDoneTask) {
      const newDoneTasks = doneTasks.filter((task) => task.key !== taskKey);
      setDoneTasks(newDoneTasks);
      await saveDoneTasks(newDoneTasks);
    } else {
      const newTaskList = taskList.filter((task) => task.key !== taskKey);
      setTaskList(newTaskList);
      await saveTasks(newTaskList);
    }
  };

  const renderTaskItem = ({ item, isDoneTask = false }) => {
    if (!item || !item.value) return null;
    
    return (
      <View style={styles.taskContainer}>
        {!isDoneTask && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={isDoneTask ? 'checked' : 'unchecked'}
              onPress={() => completeTask(item.key)}
              color="#60a5eb"
              uncheckedColor="#60a5eb"
              style={styles.checkbox}
            />
          </View>
        )}
        <View style={styles.taskInfo}>
          <Text style={[
            styles.taskText,
            isDoneTask && styles.doneTaskText
          ]}>{item.value}</Text>
          <Text style={styles.dateText}>
            {isDoneTask ? 'เสร็จเมื่อ: ' : 'กำหนดส่ง: '}
            {isDoneTask 
              ? (item.completedDate ? new Date(item.completedDate).toLocaleDateString('th-TH') : '-')
              : (item.dueDateString || '-')
            }
          </Text>
          {!isDoneTask && (
            <Text style={styles.daysLeftText}>
              เหลือเวลา {calculateDaysUntilDue(item.dueDate)} วัน
            </Text>
          )}
        </View>
        <Button
          title="Remove"
          onPress={() => removeTask(item.key, isDoneTask)}
          color="#ff4545"
        />
      </View>
    );
  };

  const highPriorityTasks = sortedTasks.filter(
    task => calculateDaysUntilDue(task.dueDate) <= 7
  );

  const normalTasks = sortedTasks.filter(
    task => calculateDaysUntilDue(task.dueDate) > 7
  );
  const renderDatePicker = () => {
    return (
      <>
        <TouchableOpacity
          style={styles.datePickerContainer}
          onPress={showDatePickerModal}
        >
          <Calendar size={20} color="#60a5eb" style={styles.calendarIcon} />
          <Text style={styles.dateText}>
            {date.toLocaleDateString('th-TH')}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display= 'default'
            onChange={onChange}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>👾 Todo List 👾</Text>
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <TextInput
              placeholder="Enter task"
              style={styles.input}
              value={task}
              onChangeText={(text) => setTask(text)}
              maxLength={MAX_TASK_LENGTH}
            />
            {renderDatePicker()}
          </View>
        
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addTask}
          >
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>


        {highPriorityTasks.length >= 0 && (
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
                renderItem={(props) => renderTaskItem({ ...props, isDoneTask: false })}
                style={[styles.highPriorityList, styles.limitedList]}
              />
            )}
          </View>
        )}

        {normalTasks.length >= 0 && (
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
                renderItem={(props) => renderTaskItem({ ...props, isDoneTask: false })}
                style={[styles.normalList, styles.limitedList]}
              />
            )}
          </View>
        )}

        {doneTasks.length >= 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowDoneTasks(!showDoneTasks)}
            >
              <Text style={styles.sectionTitleDone}>
                Completed Tasks ({sortedDoneTasks.length})
              </Text>
              <Text style={styles.dropdownIcon}>
                {showDoneTasks ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {showDoneTasks && (
              <FlatList
                data={sortedDoneTasks}
                renderItem={(props) => renderTaskItem({ ...props, isDoneTask: true })}
                style={[styles.doneList, styles.limitedList]}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f0f0f5', 
  },
  container: {
    margin: 15,
    flex: 1,
    paddingTop: 25,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f5',
  },
  title: {
    paddingTop: 20,
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'column', 
    marginBottom: 20,
    marginHorizontal: 10,
    gap: 10, 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    padding: 10, 
    borderRadius: 10,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 18,  
  },
  datePickerContainer: {
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 8,
    height: 42,
    minWidth: 120,

  },
  calendarIcon: {
    marginRight: 4,
  },
  datePicker: {
    flex: 1,
    height: 25, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,  // เพิ่มขอบโค้งมน
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 0,
    elevation: 2,  // เพิ่มเงาให้กับส่วนหัว
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
  taskInfo: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  daysLeftText: {
    fontSize: 12,
    color: '#ff776e',
  },
  addButton: {
    backgroundColor: '#60a5eb',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,  // ขอบมน
    elevation: 5,  // เพิ่มเงาให้กับปุ่ม
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneTaskText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  sectionTitleDone: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  doneList: {
    backgroundColor: '#f0f7f0',
  },
  checkboxContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  
  checkbox: {
    transform: Platform.OS === 'ios' ? [{ scale: 0.8 }] : [{ scale: 1.2 }],
  },

  taskContainer: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    marginHorizontal: 5,
  },
  dateText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#333',
  },
});

