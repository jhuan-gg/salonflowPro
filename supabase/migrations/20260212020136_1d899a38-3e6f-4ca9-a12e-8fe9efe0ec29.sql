
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Enum para status de agendamento
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'canceled');

-- Enum para forma de pagamento
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit', 'debit', 'cash', 'other');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf_cnpj TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de atendentes
CREATE TABLE public.attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  work_hours JSONB DEFAULT '{"start":"08:00","end":"18:00"}'::jsonb,
  work_days JSONB DEFAULT '[1,2,3,4,5,6]'::jsonb,
  color TEXT NOT NULL DEFAULT '#6366f1',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  attendant_id UUID REFERENCES public.attendants(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  return_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela intermediária agendamento-serviços
CREATE TABLE public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Tabela de pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de materiais/estoque
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  current_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela material-serviço (baixa automática)
CREATE TABLE public.service_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  quantity_used NUMERIC(10,2) NOT NULL DEFAULT 1
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;

-- Função para checar role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (admin only manages, users can read own)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Para tabelas de negócio: qualquer autenticado pode ler, admin pode tudo
CREATE POLICY "Authenticated can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Authenticated can read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read attendants" ON public.attendants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage attendants" ON public.attendants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Authenticated can read appointment_services" ON public.appointment_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage appointment_services" ON public.appointment_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can insert appointment_services" ON public.appointment_services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Authenticated can read payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Authenticated can read materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read service_materials" ON public.service_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage service_materials" ON public.service_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para auto-criar perfil no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- Primeiro usuário vira admin, demais viram employee
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendants_updated_at BEFORE UPDATE ON public.attendants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
