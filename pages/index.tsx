import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Demo from "../components/DemoForm";

function useMounted() {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return isMounted;
}
const Home = () => {
  const isMounted = useMounted();

  if (!isMounted) {
    return "...";
  }
  return (
    <Layout>
      <Demo />
    </Layout>
  );
};

export default Home;
