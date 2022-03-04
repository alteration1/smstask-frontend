import { Layout } from 'antd';
import RegisterForm from './components/RegisterForm'
import 'antd/dist/antd.css';
import './App.css';

const { Header, Content } = Layout;

function App() {
  return (
    <Layout className="main">
      <Header className="header"></Header>        
        <Content><RegisterForm/></Content>
    </Layout>
  );
}

export default App;
