import React, { useEffect, useState } from "react";
import "../fonts/Jockey_One/JockeyOne-Regular.ttf";
import "../fonts/Kumbh_Sans/static/KumbhSans-Regular.ttf";
import "../fonts/JetBrains_Mono/JetBrainsMono-VariableFont_wght.ttf";
import NavigationBar from "../component/NavigationBar";

import { DragDropContext } from "@hello-pangea/dnd";
import Column from "../component/Column";
import axios from "axios";
import path from "../../path";
import DonutChartTask from "../component/DonutCharTaskPage";
import NavFile from "../component/NavFile";
import addTodo from "../assets/addTodo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Rater from "react-rater";
import "react-rater/lib/react-rater.css";
import Loading from "../component/Loading";

function Project_task() {
  const [state, setState] = useState();
  const [modal, setModal] = useState(false);
  const [user, setUser] = useState();
  const location = useLocation();
  const [todo, setTodo] = useState();
  const [end, setEnd] = useState(false);
  const [inprogress, setInprogress] = useState();
  const [done, setDone] = useState();
  const [load, setLoad] = useState(false);
  const [percent, setPercent] = useState(0);
  const [newTodoTask, setNewTodoTask] = useState("");
  const [star, setStar] = useState(0);
  const router = useNavigate();
  const obj = location.state;
  if (obj == null) {
    window.location.replace("/task");
  }
  function GetTask() {
    axios
      .post(
        `${path}/mytask`,
        {
          id: localStorage.getItem("id"),
          index: obj.index,
          project: Object.keys(obj.task)[0],
        },
        {
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setPercent(percentCompleted);
          },
        }
      )
      .then((res) => {
        setState(res.data);
        setDone(res.data.columns["column-3"].taskIds.length);
        setInprogress(res.data.columns["column-2"].taskIds.length);
        setTodo(res.data.columns["column-1"].taskIds.length);
        setTimeout(() => {
          setLoad(true);
        }, 400);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  function GetUser() {
    axios
      .post(`${path}/user`, { id: localStorage.getItem("id") })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function UpdateTask(task) {
    axios
      .post(`${path}/updatetask`, {
        id: localStorage.getItem("id"),
        index: obj.index,
        project: Object.keys(obj.task)[0],
        task: task,
      })
      .then((res) => {
        setState(task);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  useEffect(() => {
    GetUser();
    GetTask();
  }, []);
  const onDragEnd = (result) => {
    const { destination, source } = result;

    // If user tries to drop in an unknown destination
    if (!destination) return;

    // if the user drags and drops back in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // If the user drops within the same column but in a different positoin
    const sourceCol = state.columns[source.droppableId];
    const destinationCol = state.columns[destination.droppableId];

    if (sourceCol.id === destinationCol.id) {
      const newColumn = reorderColumnList(
        sourceCol,
        source.index,
        destination.index
      );

      const newState = {
        ...state,
        columns: {
          ...state.columns,
          [newColumn.id]: newColumn,
        },
      };
      setState(newState);
      return;
    }

    // If the user moves from one column to another
    const startTaskIds = Array.from(sourceCol.taskIds);
    const [removed] = startTaskIds.splice(source.index, 1);
    const newStartCol = {
      ...sourceCol,
      taskIds: startTaskIds,
    };

    const endTaskIds = Array.from(destinationCol.taskIds);
    endTaskIds.splice(destination.index, 0, removed);
    const newEndCol = {
      ...destinationCol,
      taskIds: endTaskIds,
    };

    const newState = {
      ...state,
      columns: {
        ...state.columns,
        [newStartCol.id]: newStartCol,
        [newEndCol.id]: newEndCol,
      },
    };
    setState(newState);
    setDone(newState.columns["column-3"].taskIds.length);
    setInprogress(newState.columns["column-2"].taskIds.length);
    setTodo(newState.columns["column-1"].taskIds.length);
    UpdateTask(newState);
  };

  function AddTodoTask() {
    const taskTodo = Object.assign({}, state);
    let tasks = {
      ...state.tasks,
    };
    let index = Object.keys(tasks).length;
    tasks[index + 1] = {
      content: newTodoTask,
      id: index + 1,
    };
    let col1 = {
      taskIds: [...taskTodo.columns["column-1"].taskIds, index + 1],
      title: taskTodo.columns["column-1"].title,
      id: taskTodo.columns["column-1"].id,
    };
    const newState = {
      ...state,
      columns: {
        ...state.columns,
        ["column-1"]: col1,
      },
      tasks,
    };
    setDone(newState.columns["column-3"].taskIds.length);
    setInprogress(newState.columns["column-2"].taskIds.length);
    setTodo(newState.columns["column-1"].taskIds.length);
    UpdateTask(newState);
  }

  function DeleteTodoTask(index, column, id) {
    console.log(state);
    const taskTodo = Object.assign({}, state);
    let tasks = {
      ...state.tasks,
    };
    delete tasks[id];

    const newTodo = [...taskTodo.columns[column].taskIds];
    newTodo.splice(index, 1);
    let col = {
      taskIds: newTodo,
      title: taskTodo.columns[column].title,
      id: taskTodo.columns[column].id,
    };
    const newState = {
      ...state,
      columns: {
        ...state.columns,
        [column]: col,
      },
      tasks,
    };
    setDone(newState.columns["column-3"].taskIds.length);
    setInprogress(newState.columns["column-2"].taskIds.length);
    setTodo(newState.columns["column-1"].taskIds.length);
    UpdateTask(newState);
  }

  function DeleteTask(index) {
    if (confirm("Are you sure delete project")) {
      axios
        .post(`${path}/deleteproject`, {
          id: localStorage.getItem("id"),
          index: index,
        })
        .then((res) => {
          console.log(res.data);
          if (res.data == "successfully") {
            router("/task");
          }
        })
        .catch((err) => console.log(err));
    }
  }

  function AddStar(){
    axios.post(`${path}/addstar`, {
      id : localStorage.getItem('id'),
      project : Object.keys(obj.task)[0],
      star : star,
      index : obj.index

    }).then((res) =>{
      if(res.data == 'successfully'){
        window.location.replace('/task');
      }
    })
    .catch((err)=>{
      console.log(err)
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="select-none">
        {/* // Body Grid */}
        {load ? (
          <div
            className="grid grid-cols-4 lg:grid-cols-5 min-h-screen pb-20 sm:pb-0"
            style={{ backgroundColor: "#EFEADE" }}
          >
            {modal && (
              <div
                id="modal-review"
                className="w-full h-screen flex justify-center items-center absolute z-40"
              >
                <div
                  className="w-full h-full bg-[#6D6D68] absolute opacity-50"
                  onClick={() => {
                    setModal(false);
                  }}
                ></div>
                <div
                  id="modal-box"
                  className="w-[25rem] h-[16rem] rounded-2xl bg-[#FBF7F0] z-50"
                >
                  <div className="flex flex-col justify-center items-center space-y-4 ">
                    <img src={addTodo} alt="" />
                    <div className="w-4/5">
                      <p className="font-jockey text-2xl mt-2">
                        ADD YOUR TO DO
                      </p>
                    </div>
                    <input
                      onChange={(e) => {
                        setNewTodoTask(e.target.value);
                      }}
                      className="border-2 border-gray-300 rounded w-4/5 h-9 outline-none p-3 bg-[#FBF7F0]"
                    ></input>
                    <div className="flex space-x-2 w-4/5">
                      <button
                        onClick={() => {
                          setModal(false);
                        }}
                        className="border w-1/2 py-1 border-[#E5725D] text-[#E5725D] rounded-sm"
                      >
                        CANCLE
                      </button>
                      <button
                        onClick={() => {
                          setModal(false);
                          AddTodoTask();
                        }}
                        className="border w-1/2 py-1 bg-[#E5725D] text-white rounded-sm"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {end && (
              <div
                id="modal-review"
                className="w-full h-screen flex justify-center items-center absolute z-40"
              >
                <div
                  className="w-full h-full bg-[#6D6D68] absolute opacity-50"
                  onClick={() => {
                    setEnd(false);
                  }}
                ></div>
                <div
                  id="modal-box"
                  className="w-[25rem] h-[22rem] rounded-2xl bg-[#FBF7F0] z-50"
                >
                  <div className="flex flex-col justify-center items-center space-y-4 ">
                    <img src={addTodo} alt="" />
                    <div className="w-full flex  flex-col justify-center items-center">
                      <p className="font-jockey text-2xl mt-4 tracking-wide">
                        RATE YOUR PROJECT
                      </p>
                      <p className="font-kumbh tracking-wider">Cloud Project</p>
                    </div>
                    <Rater
                      className="flex pb-4 text-4xl"
                      onRate={({ rating }) => {
                        setStar(rating)
                      }}
                    />

                    <div className="flex space-x-2 w-2/3">
                      <button
                        onClick={() => {
                          setEnd(false);
                        }}
                        className="w-1/2 py-1 border-2 border-[#E5725D] text-[#E5725D] rounded-sm"
                      >
                        CANCLE
                      </button>
                      <button
                        onClick={() => {
                          setEnd(false);
                          AddStar();
                        }}
                        className="border w-1/2 py-1 bg-[#E5725D] text-white rounded-sm"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* // Navigation Bar */}
            <NavigationBar />
            {/* // Todo Body */}
            <div className="col-span-4 px-4 mx-10 h-full">
              <NavFile
                status={localStorage.getItem("incom")}
                allstatus={localStorage.getItem("allstatus")}
              />
              <div className="relative">
                <div
                  className="flex justify-between h-[35%] sm:h-[30%] space-x-8 rounded-2xl relative"
                  style={{ backgroundColor: "#FBF7F0" }}
                >
                  {/* 43% */}
                  <div className="rounded-2xl flex items-center justify-center ml-16 ">
                    <div className="text-center">
                      <p
                        className="text-7xl"
                        style={{ color: "#75C9A8", fontFamily: "jockey" }}
                      >
                        {todo == 0 && done == 0 && inprogress == 0
                          ? 0
                          : parseInt((100 / (todo + inprogress + done)) * done)}
                        %
                      </p>
                      <p
                        className="text-xl"
                        style={{ color: "#B5B7B9", fontFamily: "jockey" }}
                      >
                        Completed Tasks
                      </p>
                      <button
                        type="submit"
                        className="bg-transparent border-2 text-[#E5725D] border-[#F08D6E] rounded-sm font-semibold text-sm px-6 py-1 mt-6"
                        onClick={() => {
                          setModal(true);
                        }}
                      >
                        ADD TO DO
                      </button>
                    </div>
                  </div>

                  {/* Todo */}
                  <div className="h-full p-6  sm:flex items-center justify-center hidden">
                    <div className="space-y-3">
                      <div>
                        <div className="flex space-x-3 items-center">
                          <div className="w-5 h-5 rounded-full bg-[#FFAA9B]"></div>
                          <p
                            className="text-xl font-light"
                            style={{ fontFamily: "jockey" }}
                          >
                            TO DO
                          </p>
                        </div>
                        <p
                          style={{ fontFamily: "jura" }}
                          className="ml-8 text-sm text-gray-400"
                        >
                          {todo} tasks now
                        </p>
                      </div>
                      <div>
                        <div className="flex space-x-3 items-center">
                          <div className="w-5 h-5 rounded-full bg-[#E9E9B7]"></div>
                          <p
                            className="text-xl font-light"
                            style={{ fontFamily: "jockey" }}
                          >
                            IN PROGRESS
                          </p>
                        </div>
                        <p
                          style={{ fontFamily: "jura" }}
                          className="text-sm text-gray-400 ml-8"
                        >
                          {inprogress} tasks now
                        </p>
                      </div>
                      <div>
                        <div className="flex space-x-3 items-center">
                          <div className="w-5 h-5 rounded-full bg-[#75C9A8]"></div>
                          <p
                            className="text-xl font-light"
                            style={{ fontFamily: "jockey" }}
                          >
                            DONE
                          </p>
                        </div>
                        <p
                          style={{ fontFamily: "jura" }}
                          className="ml-8 text-sm text-gray-400"
                        >
                          {done} completed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center relative">
                    <div className="w-[120px] sm:w-[200px] relative">
                      {state && (
                        <DonutChartTask task={state} index={0} cutout={"0%"} />
                      )}
                    </div>

                    {/* <div className="w" style={}></div> */}
                  </div>
                  <div className="flex flex-col justify-end w-96 bg-project">
                    <div className="flex flex-col w-44">
                      <button
                        onClick={() => DeleteTask(obj.index)}
                        type="submit"
                        className="bg-transparent border-2 text-[#E5725D] border-[#F08D6E] rounded-sm text-sm font-semibold px-6 py-1 mb-3"
                      >
                        DELETE PROJECT
                      </button>
                      {parseInt((100 / (todo + inprogress + done)) * done) ==
                        100 ? (
                        <button
                          type="submit"
                          onClick={() => {
                            setEnd(true);
                          }}
                          className="bg-[#E5725D] border-2 text-[#FBF7F0] border-[#F08D6E] rounded-sm text-sm font-semibold px-6 py-1 mb-6 outline-none"
                        >
                          END PROJECT
                        </button>
                      ) : <div className="h-12"></div>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-4 mt-10 relative">
                  {state &&
                    state.columnOrder.map((columnId) => {
                      const columns = state.columns[columnId];
                      const tasks = columns.taskIds.map(
                        (taskid) => state.tasks[taskid]
                      );
                      return (
                        <Column
                          key={columns.id}
                          column={columns}
                          task={tasks}
                          Delete={DeleteTodoTask}
                          colName={columnId}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Loading percent={percent} />
        )}
      </div>
    </DragDropContext>
  );
}

export default Project_task;
