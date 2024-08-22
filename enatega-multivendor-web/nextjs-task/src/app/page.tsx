import Header from "./components/Header/Header";
import Map from "./components/Map/Map";
import { ToastContainer } from "react-toastify";

export default function Home() {
  return (
    <main>
      <Header />
      <Map/>
      <ToastContainer />

    </main>
  );
}
